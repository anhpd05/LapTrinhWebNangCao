import type { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/types';

declare module 'next-auth' {
  interface User {
    role: Role;
  }
  interface Session {
    user: { id: string; role: Role } & DefaultSession['user'];
  }
}

// next-auth/jwt chỉ `export *` từ @auth/core/jwt nên augmentation phải trỏ thẳng vào @auth/core/jwt.
declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}
