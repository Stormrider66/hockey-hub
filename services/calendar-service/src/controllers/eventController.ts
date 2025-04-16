import { Request, Response, NextFunction } from 'express';
import db from '../db';
import { CalendarEvent } from '../types/event';
import { QueryResult } from 'pg';

// TODO: Add proper error handling and validation

/**
 * Get all calendar events, potentially filtered by query parameters.
 */
export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    const { start, end, teamId, eventTypeId, locationId } = req.query;

    // Basic validation (expand later)
    if (start && isNaN(Date.parse(start as string))) {
        return res.status(400).json({ error: true, message: 'Invalid start date format' });
    }
    if (end && isNaN(Date.parse(end as string))) {
        return res.status(400).json({ error: true, message: 'Invalid end date format' });
    }

    let queryText = 'SELECT * FROM events';
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;

    // Build WHERE clauses based on query parameters
    // Time range filtering
    if (start) {
        whereClauses.push(`end_time >= $${paramIndex++}`);
        queryParams.push(start as string);
    }
    if (end) {
        whereClauses.push(`start_time <= $${paramIndex++}`);
        queryParams.push(end as string);
    }

    // Other filters
    if (teamId) {
        whereClauses.push(`team_id = $${paramIndex++}`);
        queryParams.push(teamId as string);
    }
    if (eventTypeId) {
        whereClauses.push(`event_type = $${paramIndex++}`);
        queryParams.push(eventTypeId as string);
    }
    if (locationId) {
        whereClauses.push(`location_id = $${paramIndex++}`);
        queryParams.push(locationId as string);
    }

    // Add WHERE clauses to the query if any exist
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    queryText += ' ORDER BY start_time ASC'; // Default ordering

    console.log('[DB Query] Fetching events:', queryText, queryParams);

    try {
        const result: QueryResult<CalendarEvent> = await db.query(queryText, queryParams);
        
        // TODO: Add logic to fetch participants and resources if needed/requested

        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[Error] Failed to fetch events:', err);
        // Pass error to the generic error handler in index.ts
        next(err); 
    }
};

/**
 * Get a single event by its ID, including associated resources.
 */
export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // Basic validation for ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid event ID format' });
    }

    try {
        // Fetch the event itself
        const eventQueryText = 'SELECT * FROM events WHERE id = $1';
        console.log('[DB Query] Fetching event by ID:', eventQueryText, [id]);
        const eventResult: QueryResult<CalendarEvent> = await db.query(eventQueryText, [id]);

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Event not found' });
        }

        const event = eventResult.rows[0];

        // Fetch associated resource IDs
        const resourceQueryText = 'SELECT resource_id FROM event_resources WHERE event_id = $1';
        console.log('[DB Query] Fetching resources for event:', resourceQueryText, [id]);
        const resourceResult: QueryResult<{ resource_id: string }> = await db.query(resourceQueryText, [id]);
        event.resourceIds = resourceResult.rows.map(row => row.resource_id);

        // TODO: Fetch participants (if stored explicitly) or derive from team
        // Example if stored explicitly:
        // const participantQueryText = 'SELECT user_id, role_in_event, attendance_status FROM event_participants WHERE event_id = $1';
        // console.log('[DB Query] Fetching participants for event:', participantQueryText, [id]);
        // const participantResult: QueryResult<EventParticipant> = await db.query(participantQueryText, [id]);
        // event.participants = participantResult.rows; 
        // (Need to also fetch user names etc. from user-service or join)

        console.log('[Success] Event fetched:', event);
        res.status(200).json({ success: true, data: event });

    } catch (err) {
        console.error(`[Error] Failed to fetch event ${id}:`, err);
        next(err); // Pass to the main error handler
    }
};

/**
 * Create a new calendar event.
 */
export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    // TODO: Get organizationId and createdByUserId from authenticated user token (req.user)
    const organizationId = 'placeholder-org-id'; // Replace with actual ID from auth middleware
    const createdByUserId = 'placeholder-user-id'; // Replace with actual ID from auth middleware

    const {
        title,
        description,
        startTime,
        endTime,
        eventType,
        locationId,
        teamId,
        resourceIds, // Expecting an array of resource UUIDs
        status = 'scheduled' // Default status
    } = req.body as Partial<CalendarEvent & { resourceIds?: string[] }>;

    // --- Basic Validation ---
    if (!title || !startTime || !endTime || !eventType) {
        return res.status(400).json({ 
            error: true, 
            message: 'Missing required fields: title, startTime, endTime, eventType' 
        });
    }
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: true, message: 'Invalid date format for startTime or endTime' });
    }
    if (endDate < startDate) {
        return res.status(400).json({ error: true, message: 'endTime cannot be before startTime' });
    }
    if (resourceIds && !Array.isArray(resourceIds)) {
        return res.status(400).json({ error: true, message: 'resourceIds must be an array' });
    }
    // TODO: Validate eventType against the enum
    // TODO: Validate existence of locationId, teamId, resourceIds if provided
    // TODO: Add resource conflict detection before insertion

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Insert into events table
        const eventQueryText = `
            INSERT INTO events (organization_id, team_id, location_id, created_by_user_id, title, description, start_time, end_time, event_type, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const eventParams = [
            organizationId,
            teamId || null,
            locationId || null,
            createdByUserId,
            title,
            description || null,
            startTime,
            endTime,
            eventType,
            status
        ];

        console.log('[DB Query] Creating event:', eventQueryText, eventParams);
        const eventResult: QueryResult<CalendarEvent> = await client.query(eventQueryText, eventParams);
        const newEvent = eventResult.rows[0];

        // Insert into event_resources junction table if resourceIds are provided
        if (resourceIds && resourceIds.length > 0) {
            const resourceQueryText = `
                INSERT INTO event_resources (event_id, resource_id)
                VALUES ($1, $2)
            `;
            // Use Promise.all to run inserts concurrently within the transaction
            await Promise.all(resourceIds.map(resourceId => {
                console.log(`[DB Query] Linking resource ${resourceId} to event ${newEvent.id}`);
                // TODO: Add validation that resourceId is a valid UUID
                return client.query(resourceQueryText, [newEvent.id, resourceId]);
            }));
            // Attach resourceIds to the returned event object for confirmation
            // Ensure the type includes resourceIds potentially (adjust CalendarEvent type if needed)
            (newEvent as any).resourceIds = resourceIds; 
        }

        await client.query('COMMIT');
        console.log('[Success] Event created:', newEvent);
        res.status(201).json({ success: true, data: newEvent });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Error] Failed to create event:', err);
        next(err); // Pass to the main error handler
    } finally {
        client.release(); // Release the client back to the pool
    }
};

/**
 * Update an existing calendar event.
 */
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { 
        title,
        description,
        startTime,
        endTime,
        eventType,
        locationId,
        teamId,
        resourceIds, // Expecting an array of resource UUIDs
        status
    } = req.body as Partial<CalendarEvent & { resourceIds?: string[] }>;

    // --- Basic Validation ---
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid event ID format' });
    }
    if (startTime && isNaN(Date.parse(startTime as unknown as string))) { 
        return res.status(400).json({ error: true, message: 'Invalid date format for startTime' });
    }
    if (endTime && isNaN(Date.parse(endTime as unknown as string))) { 
        return res.status(400).json({ error: true, message: 'Invalid date format for endTime' });
    }
    if (startTime && endTime && new Date(endTime as unknown as string) < new Date(startTime as unknown as string)) { 
        return res.status(400).json({ error: true, message: 'endTime cannot be before startTime' });
    }
    if (resourceIds && !Array.isArray(resourceIds)) {
        return res.status(400).json({ error: true, message: 'resourceIds must be an array' });
    }
    // TODO: Add more validation (check enums, existence of foreign keys, etc.)
    // TODO: Add authorization check - who can update this event?
    // TODO: Add resource conflict detection if time or resources change

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // --- Update Event Fields ---
        const updateFields: string[] = [];
        const updateParams: any[] = [];
        let paramIndex = 1;
        let eventFieldsWereUpdated = false;

        // Build the SET part of the UPDATE query dynamically
        if (title !== undefined) { updateFields.push(`title = $${paramIndex++}`); updateParams.push(title); }
        if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); updateParams.push(description); }
        if (startTime !== undefined) { updateFields.push(`start_time = $${paramIndex++}`); updateParams.push(startTime); }
        if (endTime !== undefined) { updateFields.push(`end_time = $${paramIndex++}`); updateParams.push(endTime); }
        if (eventType !== undefined) { updateFields.push(`event_type = $${paramIndex++}`); updateParams.push(eventType); }
        if (locationId !== undefined) { updateFields.push(`location_id = $${paramIndex++}`); updateParams.push(locationId); }
        if (teamId !== undefined) { updateFields.push(`team_id = $${paramIndex++}`); updateParams.push(teamId); }
        if (status !== undefined) { updateFields.push(`status = $${paramIndex++}`); updateParams.push(status); }

        // Only run UPDATE query if there are fields to update
        if (updateFields.length > 0) {
            eventFieldsWereUpdated = true;
            updateFields.push(`updated_at = NOW()`); // Always update the timestamp
            const eventUpdateQueryText = `UPDATE events SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING id`;
            updateParams.push(id);

            console.log('[DB Query] Updating event fields:', eventUpdateQueryText, updateParams);
            const eventUpdateResult = await client.query(eventUpdateQueryText, updateParams);

            if (eventUpdateResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Event not found' });
            }
        }

        // --- Handle Resource Updates ---
        let resourcesWereHandled = false;
        if (resourceIds !== undefined) {
            resourcesWereHandled = true;
            // 1. Delete existing resource links for this event
            const deleteResourcesQuery = 'DELETE FROM event_resources WHERE event_id = $1';
            console.log('[DB Query] Deleting old resource links for event:', deleteResourcesQuery, [id]);
            await client.query(deleteResourcesQuery, [id]);

            // 2. Insert new resource links if any provided
            if (resourceIds.length > 0) {
                const insertResourceQuery = 'INSERT INTO event_resources (event_id, resource_id) VALUES ($1, $2)';
                await Promise.all(resourceIds.map(resourceId => {
                    console.log(`[DB Query] Linking resource ${resourceId} to event ${id}`);
                    return client.query(insertResourceQuery, [id, resourceId]);
                }));
            }
        }

        // --- Check if any update actually happened ---
        if (!eventFieldsWereUpdated && !resourcesWereHandled) {
            await client.query('ROLLBACK');
            const currentEventResult = await db.query('SELECT * FROM events WHERE id = $1', [id]);
             if (currentEventResult.rows.length === 0) {
                 return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Event not found' });
             }
             const currentEvent = currentEventResult.rows[0] as CalendarEvent;
             const currentResourcesResult = await db.query('SELECT resource_id FROM event_resources WHERE event_id = $1', [id]);
             currentEvent.resourceIds = currentResourcesResult.rows.map(r => r.resource_id);
             return res.status(200).json({ success: true, data: currentEvent, message: 'No update data provided, returning current state.' });
        }

        // --- Commit Transaction --- 
        await client.query('COMMIT');

        // --- Fetch Final State --- 
        console.log('[DB Query] Fetching final event state after update:', id);
        const finalEventResult = await db.query('SELECT * FROM events WHERE id = $1', [id]);

        if (finalEventResult.rows.length === 0) {
            console.error(`[Error] Event ${id} not found after successful update commit.`);
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Event not found after update attempt' });
        }
        const finalEvent = finalEventResult.rows[0] as CalendarEvent;

        // Fetch final resources
        const finalResourcesResult = await db.query('SELECT resource_id FROM event_resources WHERE event_id = $1', [id]);
        finalEvent.resourceIds = finalResourcesResult.rows.map(r => r.resource_id);
        // TODO: Fetch participants if needed

        console.log('[Success] Event updated:', finalEvent);
        res.status(200).json({ success: true, data: finalEvent });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Error] Failed to update event ${id}:`, err);
        next(err); // Pass to the main error handler
    } finally {
        client.release(); // Release the client back to the pool
    }
};

/**
 * Delete an event by its ID.
 */
export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // --- Basic Validation ---
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid event ID format' });
    }
    // TODO: Add authorization check - who can delete this event?

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // 1. Delete resource links (optional, depends if CASCADE is set on FK)
        // If FK has ON DELETE CASCADE, this step is not strictly needed but can be explicit
        const deleteResourcesQuery = 'DELETE FROM event_resources WHERE event_id = $1';
        console.log('[DB Query] Deleting resource links for event:', deleteResourcesQuery, [id]);
        await client.query(deleteResourcesQuery, [id]);
        
        // TODO: Delete participant links if event_participants table is used
        // const deleteParticipantsQuery = 'DELETE FROM event_participants WHERE event_id = $1';
        // console.log('[DB Query] Deleting participants for event:', deleteParticipantsQuery, [id]);
        // await client.query(deleteParticipantsQuery, [id]);

        // 2. Delete the event itself
        const deleteEventQuery = 'DELETE FROM events WHERE id = $1 RETURNING id';
        console.log('[DB Query] Deleting event:', deleteEventQuery, [id]);
        const deleteResult = await client.query(deleteEventQuery, [id]);

        // Check if an event was actually deleted
        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK'); // Event didn't exist
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Event not found' });
        }

        await client.query('COMMIT');
        console.log(`[Success] Event deleted: ${id}`);
        res.status(200).json({ success: true, message: 'Event deleted successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Error] Failed to delete event ${id}:`, err);
        next(err); // Pass to the main error handler
    } finally {
        client.release(); // Release the client back to the pool
    }
};

// Placeholder for getEventParticipants - Implement later
export const getEventParticipants = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    res.status(501).json({ message: `GET /events/${id}/participants Not Implemented Yet` });
};

// Placeholder for addEventParticipant - Implement later
export const addEventParticipant = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    res.status(501).json({ message: `POST /events/${id}/participants Not Implemented Yet`, data: req.body });
};

// Placeholder for removeEventParticipant - Implement later
export const removeEventParticipant = async (req: Request, res: Response, _next: NextFunction) => {
    const { eventId, userId } = req.params;
    res.status(501).json({ message: `DELETE /events/${eventId}/participants/${userId} Not Implemented Yet` });
}; 