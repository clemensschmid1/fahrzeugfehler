import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Realistic username patterns
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Cameron',
  'Jamie', 'Quinn', 'Dakota', 'Sage', 'River', 'Phoenix', 'Skyler', 'Blake',
  'Drew', 'Emery', 'Finley', 'Hayden', 'Kai', 'Logan', 'Mason', 'Noah',
  'Oliver', 'Parker', 'Reese', 'Rowan', 'Sam', 'Tyler', 'Zane', 'Aiden',
  'Carter', 'Ethan', 'Hunter', 'Jackson', 'Liam', 'Lucas', 'Max', 'Owen',
  'Ryan', 'Sebastian', 'Wyatt', 'Zachary', 'Emma', 'Sophia', 'Olivia', 'Isabella',
  'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark',
  'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott',
  'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker',
  'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips'
];

const adjectives = [
  'Cool', 'Swift', 'Fast', 'Bold', 'Bright', 'Sharp', 'Quick', 'Smart',
  'Brave', 'Calm', 'Wise', 'Kind', 'True', 'Real', 'Pure', 'Clear'
];

const nouns = [
  'Driver', 'Rider', 'Wheel', 'Road', 'Speed', 'Gear', 'Shift', 'Turbo',
  'Beast', 'Storm', 'Thunder', 'Lightning', 'Eagle', 'Wolf', 'Tiger', 'Lion'
];

function generateRealisticUsername(): string {
  // 70% chance: FirstName + LastName + random number
  // 20% chance: Adjective + Noun + random number
  // 10% chance: FirstName + random number
  
  const rand = Math.random();
  
  if (rand < 0.7) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const num = Math.floor(Math.random() * 999) + 1;
    return `${firstName}${lastName}${num}`.toLowerCase();
  } else if (rand < 0.9) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 99) + 1;
    return `${adj}${noun}${num}`.toLowerCase();
  } else {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const num = Math.floor(Math.random() * 9999) + 1;
    return `${firstName}${num}`.toLowerCase();
  }
}

export async function POST(req: Request) {
  try {
    const { count = 1 } = await req.json();
    
    // Use service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const usernames: string[] = [];
    const maxAttempts = 100; // Prevent infinite loops

    for (let i = 0; i < count; i++) {
      let username = '';
      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < maxAttempts) {
        username = generateRealisticUsername();
        attempts++;

        // Check if username exists in profiles table
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (!existing) {
          isUnique = true;
        }
      }

      if (!isUnique) {
        // Fallback: add timestamp if we can't find unique name
        username = `user${Date.now()}${Math.floor(Math.random() * 1000)}`;
      }

      usernames.push(username);
    }

    return NextResponse.json({ usernames });
  } catch (error) {
    console.error('Error generating usernames:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

