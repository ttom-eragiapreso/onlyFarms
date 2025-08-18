import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { name, email, password, role } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['fan', 'creator'];
    const userRole = validRoles.includes(role) ? role : 'fan';

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      provider: 'credentials',
    });

    await user.save();

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userResponse 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
