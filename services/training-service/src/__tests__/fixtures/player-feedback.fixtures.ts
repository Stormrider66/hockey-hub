import { 
  PlayerFeedback,
  FeedbackType,
  FeedbackTone,
  FeedbackStatus
} from '../../entities/PlayerFeedback';

// Valid player feedback data
export const validPlayerFeedbackData = {
  positivePracticeFeedback: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'practice' as FeedbackType,
    relatedEventId: '550e8400-e29b-41d4-a716-446655440050',
    tone: 'positive' as FeedbackTone,
    message: 'Outstanding effort in today\'s practice! Your skating has improved dramatically over the past month. The work you\'ve been putting in during off-ice training is really showing on the ice. Keep up the excellent work ethic and positive attitude.',
    actionItems: [
      'Continue current off-ice training routine',
      'Focus on applying improved skating in game situations',
      'Help mentor younger players with skating technique'
    ],
    requiresResponse: false,
    parentVisible: true,
    status: 'read' as FeedbackStatus
  },

  constructiveGameFeedback: {
    playerId: '550e8400-e29b-41d4-a716-446655440011',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'game' as FeedbackType,
    relatedEventId: '550e8400-e29b-41d4-a716-446655440051',
    tone: 'constructive' as FeedbackTone,
    message: 'Good overall game tonight with some areas we can work on. Your defensive positioning was much better - I could see you thinking about gap control throughout the game. The area we need to focus on is decision making with the puck under pressure. You have the skills, but sometimes you\'re rushing your decisions when the pressure comes.',
    actionItems: [
      'Practice puck handling under pressure drills',
      'Work on quick decision making in tight spaces',
      'Watch video of tonight\'s game to identify pressure situations'
    ],
    requiresResponse: true,
    playerResponse: 'Thanks coach. I noticed I was getting a bit panicky when they forechecked hard. I\'ll work on staying calm and making better choices.',
    playerResponseDate: new Date('2024-11-15T20:30:00Z'),
    parentVisible: true,
    status: 'acknowledged' as FeedbackStatus
  },

  behavioralFeedback: {
    playerId: '550e8400-e29b-41d4-a716-446655440012',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'behavioral' as FeedbackType,
    tone: 'critical' as FeedbackTone,
    message: 'We need to address your behavior during today\'s practice. Talking back to coaches and showing frustration when corrected is not acceptable. Hockey is a team sport that requires respect, discipline, and the ability to take coaching. Your talent is clear, but your attitude needs immediate improvement.',
    actionItems: [
      'Apologize to assistant coach for disrespectful comments',
      'Demonstrate improved attitude and receptiveness to coaching',
      'Show leadership through positive example for teammates'
    ],
    requiresResponse: true,
    parentVisible: true,
    status: 'discussed' as FeedbackStatus,
    discussedInPerson: new Date('2024-11-16T16:00:00Z')
  },

  tacticalFeedback: {
    playerId: '550e8400-e29b-41d4-a716-446655440013',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'tactical' as FeedbackType,
    relatedEventId: '550e8400-e29b-41d4-a716-446655440052',
    tone: 'mixed' as FeedbackTone,
    message: 'Your understanding of our defensive system is really improving. I saw you communicating well with your defensive partner and making good reads on when to step up. However, you\'re still struggling with our breakout system. Remember, patience is key - wait for your support before making the pass. Rushing the breakout is leading to turnovers.',
    actionItems: [
      'Review breakout system video before next practice',
      'Practice breakout timing with defensive partner',
      'Focus on patience - it\'s okay to hold the puck an extra second'
    ],
    requiresResponse: false,
    parentVisible: false, // Tactical feedback not shared with parents
    status: 'read' as FeedbackStatus
  },

  generalFeedback: {
    playerId: '550e8400-e29b-41d4-a716-446655440014',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'general' as FeedbackType,
    tone: 'positive' as FeedbackTone,
    message: 'I wanted to acknowledge the tremendous improvement in your overall approach to hockey this season. Your preparation, attitude, and commitment have all taken a big step forward. You\'re becoming the type of player that teammates look up to and coaches enjoy working with. Keep building on this foundation.',
    actionItems: [
      'Continue current preparation routine',
      'Take on more leadership responsibilities',
      'Help set positive example for newer players'
    ],
    requiresResponse: false,
    parentVisible: true,
    status: 'acknowledged' as FeedbackStatus
  },

  urgentFeedback: {
    playerId: '550e8400-e29b-41d4-a716-446655440015',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'behavioral' as FeedbackType,
    tone: 'critical' as FeedbackTone,
    message: 'URGENT: We need to meet immediately to discuss tonight\'s incident in the locker room. The behavior you displayed toward a teammate is completely unacceptable and goes against everything our team stands for. This requires immediate attention and consequences.',
    actionItems: [
      'Meeting scheduled for tomorrow 7:00 AM before school',
      'Parents will be contacted tonight',
      'Prepare to explain your actions and outline improvement plan'
    ],
    requiresResponse: true,
    parentVisible: true,
    status: 'unread' as FeedbackStatus
  }
};

// Invalid player feedback data
export const invalidPlayerFeedbackData = {
  missingRequired: {
    // Missing playerId, coachId, type, tone, message
    requiresResponse: false,
    parentVisible: false,
    status: 'unread' as FeedbackStatus
  },

  invalidType: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'invalid_type' as any,
    tone: 'positive' as FeedbackTone,
    message: 'Test message',
    requiresResponse: false,
    parentVisible: false,
    status: 'unread' as FeedbackStatus
  },

  invalidTone: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'general' as FeedbackType,
    tone: 'invalid_tone' as any,
    message: 'Test message',
    requiresResponse: false,
    parentVisible: false,
    status: 'unread' as FeedbackStatus
  },

  invalidStatus: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'general' as FeedbackType,
    tone: 'positive' as FeedbackTone,
    message: 'Test message',
    requiresResponse: false,
    parentVisible: false,
    status: 'invalid_status' as any
  },

  invalidUUIDs: {
    playerId: 'not-a-uuid',
    coachId: 'also-not-a-uuid',
    type: 'general' as FeedbackType,
    relatedEventId: 'definitely-not-a-uuid',
    tone: 'positive' as FeedbackTone,
    message: 'Test message',
    requiresResponse: false,
    parentVisible: false,
    status: 'unread' as FeedbackStatus
  },

  missingPlayerResponse: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'general' as FeedbackType,
    tone: 'constructive' as FeedbackTone,
    message: 'Test message requiring response',
    requiresResponse: true, // Requires response but no response provided
    parentVisible: false,
    status: 'acknowledged' as FeedbackStatus // Status indicates response but no response data
  },

  emptyMessage: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'general' as FeedbackType,
    tone: 'positive' as FeedbackTone,
    message: '', // Empty message
    requiresResponse: false,
    parentVisible: false,
    status: 'unread' as FeedbackStatus
  }
};

// Edge case data
export const edgeCasePlayerFeedbackData = {
  veryLongMessage: {
    playerId: '550e8400-e29b-41d4-a716-446655440020',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'general' as FeedbackType,
    tone: 'mixed' as FeedbackTone,
    message: `This is an extremely detailed piece of feedback that covers many aspects of the player's development and performance over an extended period. 

I want to start by acknowledging the significant improvements you've made this season. Your work ethic has been exceptional, and it's showing in every aspect of your game. Your skating has improved dramatically - the power skating sessions over the summer have paid huge dividends. Your first three steps are quicker, your crossovers are more powerful, and your balance through turns has improved significantly.

From a technical standpoint, your shot has become a real weapon. The changes we made to your release point and follow-through are now automatic, and I can see the confidence you have when shooting. Your passing has also improved - you're seeing the ice better and making quicker decisions with the puck.

Tactically, you're starting to understand our systems at a deeper level. Your positioning in the defensive zone has been much better, and you're communicating more with your teammates. However, there are still areas where we need continued focus.

Your decision-making under pressure needs work. When the forecheck comes hard, you sometimes panic and make poor choices with the puck. We've talked about this before - you have the skills to handle pressure situations, but you need to trust your abilities and stay calm.

Your compete level, while much improved, still needs to be more consistent. There are shifts where you're all over the ice making things happen, and other shifts where you seem to disappear. Elite players impact the game on every shift, regardless of how they're feeling.

Moving forward, I want you to focus on three main areas: consistency of effort, decision-making under pressure, and continuing to develop your leadership voice on the ice. You have all the tools to be a special player - now it's about putting it all together consistently.

Keep up the great work, and remember that development is a process. The improvements you've made this year are significant, and if you continue on this trajectory, you're going to have an outstanding career.`,
    actionItems: [
      'Maintain current training routine - it\'s working',
      'Practice pressure situations in skill sessions',
      'Work on consistency of effort - make every shift count',
      'Develop leadership voice - communicate more on ice',
      'Continue video review to improve decision-making',
      'Set weekly goals for compete level consistency',
      'Work with mental performance coach on pressure situations'
    ],
    requiresResponse: true,
    playerResponse: 'Thank you coach for taking the time to write such detailed feedback. I really appreciate you noticing the improvements I\'ve been working on. I agree with your assessment about my consistency and decision-making under pressure. I\'ve been working with the mental performance coach you recommended, and it\'s helping me stay calmer when teams pressure me. I\'m committed to working on these areas and becoming the consistent player you know I can be.',
    playerResponseDate: new Date('2024-11-20T19:45:00Z'),
    parentVisible: true,
    status: 'acknowledged' as FeedbackStatus
  },

  multipleActionItems: {
    playerId: '550e8400-e29b-41d4-a716-446655440021',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'practice' as FeedbackType,
    relatedEventId: '550e8400-e29b-41d4-a716-446655440055',
    tone: 'constructive' as FeedbackTone,
    message: 'Today\'s practice showed both your potential and the areas where focused work is needed. You have the physical tools and hockey sense to succeed at the next level, but consistency in execution remains the key challenge.',
    actionItems: [
      'Complete 30 minutes of stickhandling practice daily',
      'Watch assigned video clips of NHL players in similar situations',
      'Practice shooting accuracy for 20 minutes after each team practice',
      'Work with skating coach twice per week to improve first step quickness',
      'Attend additional small-group tactical sessions on Sundays',
      'Complete mental training exercises using recommended app',
      'Meet with nutritionist to optimize pre-game meal planning',
      'Increase off-ice training to 4 sessions per week',
      'Practice face-off technique with assistant coach after practice',
      'Review and memorize all defensive zone coverage options',
      'Work on communication skills - call plays louder and clearer',
      'Develop pre-game routine for consistency in preparation',
      'Track sleep patterns and aim for 9+ hours per night',
      'Practice positive self-talk during difficult moments in practice',
      'Set up weekly one-on-one meetings with position-specific coach'
    ],
    requiresResponse: true,
    parentVisible: true,
    status: 'unread' as FeedbackStatus
  },

  oldDiscussedFeedback: {
    playerId: '550e8400-e29b-41d4-a716-446655440022',
    coachId: '550e8400-e29b-41d4-a716-446655440002', // Different coach
    type: 'behavioral' as FeedbackType,
    tone: 'critical' as FeedbackTone,
    message: 'This feedback is from several months ago regarding attitude and respect issues that have since been resolved through discussion and behavior modification.',
    actionItems: [
      'Apologize to teammates for negative attitude',
      'Demonstrate improved sportsmanship',
      'Show respect for coaching staff'
    ],
    requiresResponse: true,
    playerResponse: 'I understand my behavior was unacceptable and I\'ve worked hard to change my attitude. I apologize for my actions and am committed to being a better teammate.',
    playerResponseDate: new Date('2024-08-20T14:30:00Z'),
    parentVisible: true,
    status: 'discussed' as FeedbackStatus,
    discussedInPerson: new Date('2024-08-22T16:00:00Z')
  },

  emergencyFeedback: {
    playerId: '550e8400-e29b-41d4-a716-446655440023',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'behavioral' as FeedbackType,
    tone: 'critical' as FeedbackTone,
    message: 'IMMEDIATE ATTENTION REQUIRED: Serious disciplinary incident occurred during today\'s game. Player received game misconduct for unsportsmanlike conduct toward officials. This behavior is completely unacceptable and will result in immediate consequences including suspension from next game and mandatory meeting with parents.',
    actionItems: [
      'Suspended from next scheduled game',
      'Mandatory meeting with parents scheduled for tomorrow',
      'Written apology letter to referee required',
      'Complete anger management session with team psychologist',
      'Additional conditioning punishment to be determined',
      'Must demonstrate improved behavior for minimum 2 weeks before full reinstatement'
    ],
    requiresResponse: true,
    parentVisible: true,
    status: 'unread' as FeedbackStatus
  },

  positiveProgressUpdate: {
    playerId: '550e8400-e29b-41d4-a716-446655440024',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    type: 'general' as FeedbackType,
    tone: 'positive' as FeedbackTone,
    message: 'Incredible progress over the past month! The dedication you\'ve shown to improving your weak areas is paying off in a big way. Your defensive positioning has improved dramatically, and your confidence with the puck is growing every game. Most importantly, your leadership and positive attitude are having a great impact on the entire team.',
    actionItems: [
      'Continue current development plan - it\'s working perfectly',
      'Take on increased leadership role with younger players',
      'Consider captain or alternate captain role for next season'
    ],
    requiresResponse: false,
    parentVisible: true,
    status: 'acknowledged' as FeedbackStatus
  }
};

// Bulk data for performance testing
export const bulkPlayerFeedbackData = Array.from({ length: 100 }, (_, index) => ({
  playerId: `550e8400-e29b-41d4-a716-446655441${index.toString().padStart(3, '0')}`,
  coachId: `550e8400-e29b-41d4-a716-446655440${(index % 5).toString().padStart(3, '0')}`,
  type: (['game', 'practice', 'general', 'behavioral', 'tactical'] as FeedbackType[])[index % 5],
  ...(index % 3 === 0 && { relatedEventId: `550e8400-e29b-41d4-a716-446655440${(500 + index).toString()}` }),
  tone: (['positive', 'constructive', 'critical', 'mixed'] as FeedbackTone[])[index % 4],
  message: `Bulk feedback message ${index + 1}. This is generated test feedback for player performance and development tracking.`,
  ...(index % 4 === 0 && {
    actionItems: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      (_, i) => `Bulk action item ${i + 1} for feedback ${index + 1}`
    )
  }),
  requiresResponse: index % 3 === 0,
  ...(index % 3 === 0 && index % 6 === 0 && {
    playerResponse: `Bulk player response ${index + 1}`,
    playerResponseDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
  }),
  parentVisible: index % 2 === 0,
  status: (['unread', 'read', 'acknowledged', 'discussed'] as FeedbackStatus[])[index % 4],
  ...(index % 4 === 3 && {
    discussedInPerson: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000)
  })
}));

// Export all fixtures
export const playerFeedbackFixtures = {
  valid: validPlayerFeedbackData,
  invalid: invalidPlayerFeedbackData,
  edgeCase: edgeCasePlayerFeedbackData,
  bulk: bulkPlayerFeedbackData
};