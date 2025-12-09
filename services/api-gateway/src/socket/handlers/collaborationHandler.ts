import {
  SocketEventType,
  CollaborationCursorEvent,
  CollaborationEditEvent
} from '../../types/socket-events';
import Logger from '../../utils/logger';
import { AuthenticatedSocket } from '../../types/socket';

// Track active collaborators per document
const activeCollaborators = new Map<string, Map<string, any>>(); // documentId -> Map<userId, userInfo>

// User colors for collaboration
const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#48DBFB', '#FF9FF3', '#54A0FF', '#C7ECEE', '#BADC58'
];

function getUserColor(userId: string, documentId: string): string {
  const docCollaborators = activeCollaborators.get(documentId);
  if (!docCollaborators) return userColors[0];
  
  const userIndex = Array.from(docCollaborators.keys()).indexOf(userId);
  return userColors[userIndex % userColors.length];
}

export function registerCollaborationHandlers(socket: AuthenticatedSocket, io: any) {
  // Join document collaboration session
  socket.on('collaboration:join', (data: { documentId: string; documentType: string }) => {
    try {
      if (!socket.userId || !socket.userEmail) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'User not authenticated',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      const { documentId, documentType } = data;
      const docRoom = `doc:${documentId}`;
      
      // Join document room
      socket.join(docRoom);

      // Initialize collaborators map for this document
      if (!activeCollaborators.has(documentId)) {
        activeCollaborators.set(documentId, new Map());
      }

      // Get user color
      const userColor = getUserColor(socket.userId, documentId);

      // Add user to active collaborators
      const userInfo = {
        userId: socket.userId,
        userName: socket.userEmail,
        color: userColor,
        joinedAt: new Date(),
        socketId: socket.id
      };
      activeCollaborators.get(documentId)!.set(socket.userId, userInfo);

      // Notify other collaborators
      socket.to(docRoom).emit('collaboration:user:joined', {
        userId: socket.userId,
        userName: socket.userEmail,
        color: userColor,
        timestamp: new Date()
      });

      // Send current collaborators to the joining user
      const collaborators = Array.from(activeCollaborators.get(documentId)!.values());
      socket.emit('collaboration:users', {
        documentId,
        collaborators: collaborators.map(c => ({
          userId: c.userId,
          userName: c.userName,
          color: c.color
        }))
      });

      Logger.info('User joined collaboration session', {
        socketId: socket.id,
        userId: socket.userId,
        documentId,
        documentType,
        collaboratorCount: collaborators.length
      });
    } catch (error: any) {
      Logger.error('Error joining collaboration session', {
        socketId: socket.id,
        userId: socket.userId,
        data,
        error: error?.message
      });
      socket.emit(SocketEventType.CONNECTION_ERROR, {
        message: 'Failed to join collaboration session',
        code: 'JOIN_ERROR'
      });
    }
  });

  // Leave document collaboration session
  socket.on('collaboration:leave', (documentId: string) => {
    try {
      if (!socket.userId) return;

      const docRoom = `doc:${documentId}`;
      socket.leave(docRoom);

      // Remove from active collaborators
      if (activeCollaborators.has(documentId)) {
        activeCollaborators.get(documentId)!.delete(socket.userId);
        
        // Clean up empty documents
        if (activeCollaborators.get(documentId)!.size === 0) {
          activeCollaborators.delete(documentId);
        }
      }

      // Notify other collaborators
      socket.to(docRoom).emit('collaboration:user:left', {
        userId: socket.userId,
        timestamp: new Date()
      });

      Logger.info('User left collaboration session', {
        socketId: socket.id,
        userId: socket.userId,
        documentId
      });
    } catch (error: any) {
      Logger.error('Error leaving collaboration session', {
        socketId: socket.id,
        userId: socket.userId,
        documentId,
        error: error?.message
      });
    }
  });

  // Handle cursor movement
  socket.on(SocketEventType.COLLABORATION_CURSOR, (data: Omit<CollaborationCursorEvent, 'userId' | 'userName'>) => {
    try {
      if (!socket.userId || !socket.userEmail) return;

      const { documentId, position, selection } = data;
      const docRoom = `doc:${documentId}`;

      // Get user color
      const userColor = getUserColor(socket.userId, documentId);

      // Create cursor event
      const cursorEvent: CollaborationCursorEvent = {
        userId: socket.userId,
        userName: socket.userEmail,
        documentId,
        position,
        selection,
        color: userColor
      };

      // Broadcast to other collaborators
      socket.to(docRoom).emit(SocketEventType.COLLABORATION_CURSOR, cursorEvent);

    } catch (error: any) {
      Logger.error('Error broadcasting cursor position', {
        socketId: socket.id,
        userId: socket.userId,
        error: error?.message
      });
    }
  });

  // Handle collaborative edits
  socket.on(SocketEventType.COLLABORATION_EDIT, (data: Omit<CollaborationEditEvent, 'userId'>) => {
    try {
      if (!socket.userId) return;

      const { documentId, changes, version } = data;
      const docRoom = `doc:${documentId}`;

      // Check if user has permission to edit
      const canEdit = socket.roles?.some(role => 
        ['coach', 'admin', 'club_admin', 'medical_staff', 'physical_trainer'].includes(role)
      );

      if (!canEdit) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'Insufficient permissions to edit document',
          code: 'PERMISSION_DENIED'
        });
        return;
      }

      // Create edit event
      const editEvent: CollaborationEditEvent = {
        userId: socket.userId,
        documentId,
        changes,
        version
      };

      // Broadcast to other collaborators
      socket.to(docRoom).emit(SocketEventType.COLLABORATION_EDIT, editEvent);

      // Acknowledge the edit
      socket.emit('collaboration:edit:ack', {
        documentId,
        version,
        timestamp: new Date()
      });

      Logger.info('Collaborative edit broadcasted', {
        socketId: socket.id,
        userId: socket.userId,
        documentId,
        changeCount: changes.length,
        version
      });
    } catch (error: any) {
      Logger.error('Error broadcasting collaborative edit', {
        socketId: socket.id,
        userId: socket.userId,
        data,
        error: error?.message
      });
      socket.emit(SocketEventType.CONNECTION_ERROR, {
        message: 'Failed to broadcast edit',
        code: 'EDIT_ERROR'
      });
    }
  });

  // Handle document save
  socket.on(SocketEventType.COLLABORATION_SAVE, (data: { documentId: string; version: number }) => {
    try {
      if (!socket.userId) return;

      const { documentId, version } = data;
      const docRoom = `doc:${documentId}`;

      // Verify user can save
      const canSave = socket.roles?.some(role => 
        ['coach', 'admin', 'club_admin', 'medical_staff', 'physical_trainer'].includes(role)
      );

      if (!canSave) {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'Insufficient permissions to save document',
          code: 'PERMISSION_DENIED'
        });
        return;
      }

      // Notify all collaborators of save
      io.to(docRoom).emit('collaboration:saved', {
        savedBy: socket.userId,
        documentId,
        version,
        timestamp: new Date()
      });

      Logger.info('Document saved', {
        socketId: socket.id,
        userId: socket.userId,
        documentId,
        version
      });
    } catch (error: any) {
      Logger.error('Error saving document', {
        socketId: socket.id,
        userId: socket.userId,
        data,
        error: error?.message
      });
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    if (!socket.userId) return;

    // Remove user from all document collaborations
    activeCollaborators.forEach((collaborators, documentId) => {
      if (collaborators.has(socket.userId!)) {
        collaborators.delete(socket.userId!);
        
        // Notify other collaborators
        const docRoom = `doc:${documentId}`;
        socket.to(docRoom).emit('collaboration:user:left', {
          userId: socket.userId,
          timestamp: new Date()
        });

        // Clean up empty documents
        if (collaborators.size === 0) {
          activeCollaborators.delete(documentId);
        }
      }
    });
  });
}

// Get active collaborators for a document
export function getActiveCollaborators(documentId: string) {
  const collaborators = activeCollaborators.get(documentId);
  if (!collaborators) return [];
  
  return Array.from(collaborators.values()).map(c => ({
    userId: c.userId,
    userName: c.userName,
    color: c.color
  }));
}