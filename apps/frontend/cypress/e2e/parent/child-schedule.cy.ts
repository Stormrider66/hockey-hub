import { ParentDashboard } from '../../page-objects/ParentDashboard';
import { testUsers, viewports } from '../../support/e2e';

describe('Parent Viewing Child Schedule', () => {
  const parentDashboard = new ParentDashboard();
  
  beforeEach(() => {
    // Login as parent
    cy.login(testUsers.parent.email, testUsers.parent.password);
    
    // Mock parent's children data
    cy.mockApiResponse('GET', '**/api/parent/children', {
      children: [
        {
          id: '1',
          name: 'Emma Johnson',
          teamId: 'team1',
          teamName: 'U14 Hawks',
          role: 'PLAYER',
          photo: '/avatars/emma.jpg',
        },
        {
          id: '2',
          name: 'Liam Johnson',
          teamId: 'team2',
          teamName: 'U12 Eagles',
          role: 'PLAYER',
          photo: '/avatars/liam.jpg',
        },
      ],
    });
  });
  
  describe('Viewing Child Schedule', () => {
    it('should display schedule for first child by default', () => {
      // Mock schedule for Emma
      cy.mockApiResponse('GET', '**/api/parent/children/1/schedule', {
        events: [
          {
            id: 'e1',
            title: 'Team Practice',
            date: '2025-07-03',
            startTime: '16:00',
            endTime: '18:00',
            location: 'Main Rink',
            type: 'practice',
            rsvpStatus: 'attending',
          },
          {
            id: 'e2',
            title: 'Game vs. Sharks',
            date: '2025-07-05',
            startTime: '19:00',
            endTime: '21:00',
            location: 'Away Arena',
            type: 'game',
            rsvpStatus: null,
          },
          {
            id: 'e3',
            title: 'Team Meeting',
            date: '2025-07-06',
            startTime: '18:00',
            endTime: '19:00',
            location: 'Meeting Room',
            type: 'meeting',
            rsvpStatus: 'maybe',
          },
        ],
      });
      
      parentDashboard.visit();
      
      // Should show Emma's schedule by default
      cy.contains('Emma Johnson').should('have.class', 'active');
      parentDashboard.viewChildSchedule();
      
      // Verify events are displayed
      parentDashboard.viewUpcomingEvent('Team Practice');
      parentDashboard.viewUpcomingEvent('Game vs. Sharks');
      parentDashboard.viewUpcomingEvent('Team Meeting');
    });
    
    it('should switch between children schedules', () => {
      // Mock schedule for Liam
      cy.mockApiResponse('GET', '**/api/parent/children/2/schedule', {
        events: [
          {
            id: 'e4',
            title: 'Skills Training',
            date: '2025-07-03',
            startTime: '15:00',
            endTime: '16:00',
            location: 'Practice Rink',
            type: 'training',
            rsvpStatus: 'attending',
          },
          {
            id: 'e5',
            title: 'Tournament',
            date: '2025-07-07',
            startTime: '08:00',
            endTime: '17:00',
            location: 'Sports Complex',
            type: 'tournament',
            rsvpStatus: null,
          },
        ],
      });
      
      parentDashboard.visit();
      
      // Switch to Liam
      parentDashboard.selectChild('Liam Johnson');
      
      // Should show Liam's schedule
      cy.contains('Liam Johnson').should('have.class', 'active');
      parentDashboard.viewUpcomingEvent('Skills Training');
      parentDashboard.viewUpcomingEvent('Tournament');
      
      // Should not show Emma's events
      cy.contains('Team Practice').should('not.exist');
    });
    
    it('should handle RSVP for events', () => {
      parentDashboard.visit();
      
      // View event details
      parentDashboard.viewEventDetails('Game vs. Sharks');
      
      // RSVP as attending
      parentDashboard.rsvpToEvent('attending');
      
      // Mock RSVP response
      cy.mockApiResponse('POST', '**/api/events/e2/rsvp', {
        success: true,
        rsvpStatus: 'attending',
      });
      
      parentDashboard.assertRsvpSaved();
      
      // Verify RSVP status updated
      cy.get('[data-testid="event-e2"]').should('contain', 'Attending');
    });
    
    it('should display calendar view with all events', () => {
      parentDashboard.visit();
      parentDashboard.openCalendarView();
      
      // Mock calendar events
      cy.mockApiResponse('GET', '**/api/parent/children/1/calendar', {
        events: [
          {
            id: 'e1',
            title: 'Team Practice',
            start: '2025-07-03T16:00:00',
            end: '2025-07-03T18:00:00',
            color: '#4CAF50',
            type: 'practice',
          },
          {
            id: 'e2',
            title: 'Game vs. Sharks',
            start: '2025-07-05T19:00:00',
            end: '2025-07-05T21:00:00',
            color: '#FF5722',
            type: 'game',
          },
        ],
      });
      
      // Check calendar is displayed
      cy.get('[data-testid="calendar-view"]').should('be.visible');
      
      // Check month view
      cy.get('.rbc-month-view').should('be.visible');
      
      // Verify events are shown
      cy.contains('.rbc-event', 'Team Practice').should('be.visible');
      cy.contains('.rbc-event', 'Game vs. Sharks').should('be.visible');
      
      // Switch to week view
      cy.get('button:contains("Week")').click();
      cy.get('.rbc-week-view').should('be.visible');
    });
    
    it('should show transportation coordination', () => {
      parentDashboard.visit();
      parentDashboard.viewEventDetails('Game vs. Sharks');
      
      // Mock transportation data
      cy.mockApiResponse('GET', '**/api/events/e2/transportation', {
        carpools: [
          {
            id: 'c1',
            driver: 'John Smith',
            availableSeats: 2,
            departureTime: '18:00',
            pickupLocation: 'Arena Parking Lot',
            riders: ['Emma Johnson'],
          },
        ],
        needsRide: ['Player 3', 'Player 4'],
      });
      
      // Check transportation tab
      cy.get('[data-testid="transportation-tab"]').click();
      
      // View carpool options
      cy.contains('John Smith').should('be.visible');
      cy.contains('2 seats available').should('be.visible');
      
      // Join carpool
      cy.get('[data-testid="join-carpool-c1"]').click();
      cy.checkToast('Joined carpool successfully');
    });
  });
  
  describe('Medical Information Access', () => {
    it('should view child medical information', () => {
      // Mock medical data
      cy.mockApiResponse('GET', '**/api/parent/children/1/medical', {
        medicalInfo: {
          allergies: ['Peanuts', 'Shellfish'],
          medications: ['Inhaler for asthma'],
          conditions: ['Mild asthma'],
          emergencyContacts: [
            {
              name: 'Sarah Johnson',
              phone: '+1234567890',
              relationship: 'Mother',
            },
          ],
          lastPhysical: '2025-01-15',
          physicalDue: '2026-01-15',
        },
        injuries: [
          {
            id: 'i1',
            date: '2025-06-15',
            type: 'Sprain',
            bodyPart: 'Ankle',
            status: 'Recovered',
            recoveryDate: '2025-06-28',
          },
        ],
      });
      
      parentDashboard.visit();
      parentDashboard.viewMedicalInfo();
      
      // Check medical information display
      cy.contains('Allergies').should('be.visible');
      cy.contains('Peanuts').should('be.visible');
      cy.contains('Shellfish').should('be.visible');
      
      // View injury history
      parentDashboard.viewInjuryHistory();
      cy.contains('Ankle Sprain').should('be.visible');
      cy.contains('Recovered').should('be.visible');
    });
    
    it('should update emergency contacts', () => {
      parentDashboard.visit();
      parentDashboard.viewMedicalInfo();
      
      parentDashboard.updateEmergencyContact({
        name: 'John Johnson',
        phone: '+19876543210',
        relationship: 'Father',
      });
      
      // Mock update response
      cy.mockApiResponse('PUT', '**/api/parent/children/1/emergency-contacts', {
        success: true,
      });
      
      parentDashboard.assertEmergencyContactUpdated();
    });
  });
  
  describe('Communication Features', () => {
    it('should send message to coach', () => {
      parentDashboard.visit();
      
      // Mock coach data
      cy.mockApiResponse('GET', '**/api/parent/children/1/coaches', {
        coaches: [
          {
            id: 'coach1',
            name: 'Coach Mike',
            role: 'Head Coach',
            email: 'mike@hockeyhub.com',
          },
        ],
      });
      
      parentDashboard.sendMessageToCoach('Hi Coach, Emma will be 15 minutes late to practice today due to a doctor appointment.');
      
      // Mock send message
      cy.mockApiResponse('POST', '**/api/messages/send', {
        success: true,
        messageId: 'm1',
      });
      
      parentDashboard.assertMessageSent();
    });
    
    it('should view and respond to team announcements', () => {
      // Mock messages
      cy.mockApiResponse('GET', '**/api/parent/messages', {
        messages: [
          {
            id: 'm1',
            from: 'Coach Mike',
            subject: 'Tournament Schedule',
            content: 'Tournament schedule has been updated...',
            date: '2025-07-01T10:00:00',
            read: false,
          },
          {
            id: 'm2',
            from: 'Team Manager',
            subject: 'Jersey Orders',
            content: 'Jersey order forms are due...',
            date: '2025-06-30T14:00:00',
            read: true,
          },
        ],
      });
      
      parentDashboard.visit();
      parentDashboard.viewMessages();
      
      // Check unread message
      cy.get('[data-testid="message-m1"]').should('have.class', 'unread');
      cy.get('[data-testid="message-m1"]').click();
      
      // Message details
      cy.contains('Tournament Schedule').should('be.visible');
      cy.contains('Tournament schedule has been updated').should('be.visible');
      
      // Mark as read
      cy.checkToast('Message marked as read');
    });
  });
  
  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile.width, viewports.mobile.height);
    });
    
    it('should navigate schedule on mobile', () => {
      parentDashboard.visit();
      
      // Check mobile layout
      cy.get('[data-testid="mobile-child-selector"]').should('be.visible');
      
      // Swipe between children (simulated)
      cy.get('[data-testid="child-tab-1"]').should('be.visible');
      cy.get('[data-testid="mobile-child-selector"]').trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] });
      cy.get('[data-testid="mobile-child-selector"]').trigger('touchmove', { touches: [{ clientX: 50, clientY: 100 }] });
      cy.get('[data-testid="mobile-child-selector"]').trigger('touchend');
      cy.get('[data-testid="child-tab-2"]').should('be.visible');
      
      // View schedule in mobile format
      parentDashboard.viewChildSchedule();
      
      // Events should be in card format on mobile
      cy.get('[data-testid="mobile-event-card"]').should('have.length.at.least', 1);
    });
    
    it('should handle RSVP on mobile with touch-friendly buttons', () => {
      parentDashboard.visit();
      
      // Open event
      cy.get('[data-testid="event-e2"]').click();
      
      // Check button sizes for mobile
      cy.get('[data-testid="rsvp-attending"]').should('have.css', 'min-height', '44px');
      cy.get('[data-testid="rsvp-not-attending"]').should('have.css', 'min-height', '44px');
      
      // RSVP
      parentDashboard.rsvpToEvent('attending');
      parentDashboard.assertRsvpSaved();
    });
  });
  
  describe('Payment Management', () => {
    it('should view and pay outstanding invoices', () => {
      // Mock payment data
      cy.mockApiResponse('GET', '**/api/parent/payments', {
        invoices: [
          {
            id: 'inv1',
            description: 'Team Registration Fee',
            amount: 250.00,
            dueDate: '2025-07-15',
            status: 'pending',
            child: 'Emma Johnson',
          },
          {
            id: 'inv2',
            description: 'Tournament Fee',
            amount: 75.00,
            dueDate: '2025-07-10',
            status: 'pending',
            child: 'Liam Johnson',
          },
        ],
        paymentHistory: [
          {
            id: 'pay1',
            description: 'Monthly Training Fee',
            amount: 150.00,
            date: '2025-06-01',
            status: 'completed',
          },
        ],
      });
      
      parentDashboard.visit();
      parentDashboard.viewPayments();
      
      // Check outstanding invoices
      cy.contains('$250.00').should('be.visible');
      cy.contains('Team Registration Fee').should('be.visible');
      
      // Make payment
      parentDashboard.makePayment('inv1');
      
      // Payment flow would redirect to payment provider
      cy.url().should('include', '/payment');
    });
  });
});