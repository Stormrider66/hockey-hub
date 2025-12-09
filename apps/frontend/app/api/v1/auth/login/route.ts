import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log(`🔐 Login attempt for: ${email}`);
    
    // Simple validation for demo accounts
    const validAccounts = [
      { email: 'player@hockeyhub.com', password: 'demo123', role: 'player', name: 'Erik Johansson' },
      { email: 'coach@hockeyhub.com', password: 'demo123', role: 'coach', name: 'Lars Andersson' },
      { email: 'parent@hockeyhub.com', password: 'demo123', role: 'parent', name: 'Anna Nilsson' },
      { email: 'medical@hockeyhub.com', password: 'demo123', role: 'medical_staff', name: 'Dr. Svensson' },
      { email: 'trainer@hockeyhub.com', password: 'demo123', role: 'physical_trainer', name: 'Magnus Kraft' },
    ];
    
    const user = validAccounts.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Generate mock tokens
    const mockToken = btoa(`${user.email}:${Date.now()}`);
    
    console.log(`✅ Login successful for: ${email} (${user.role})`);
    
    return NextResponse.json({
      access_token: mockToken,
      refresh_token: `refresh_${mockToken}`,
      user: {
        id: validAccounts.indexOf(user) + 1,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}