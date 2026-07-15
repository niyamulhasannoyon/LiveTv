import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const usersPath = path.join(process.cwd(), 'data', 'users.json');

function readUsers() {
  if (!fs.existsSync(usersPath)) {
    // Initial user account master database setup context tracking
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const defaultData = [
      { id: '1', username: 'admin', email: 'niyamulhasanbd@gmail.com', password: adminPasswordHash, role: 'admin' }
    ];
    fs.mkdirSync(path.dirname(usersPath), { recursive: true });
    fs.writeFileSync(usersPath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch (err) {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();
    const users = readUsers();

    if (users.find((u: any) => u.email === email || u.username === username)) {
      return NextResponse.json({ error: 'User mapping already exists inside system registry.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = email === 'niyamulhasanbd@gmail.com' ? 'admin' : 'user';
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      role
    };

    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true, message: 'Account registry successfully integrated.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
