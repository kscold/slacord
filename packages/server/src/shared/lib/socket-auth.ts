import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import type { Socket } from 'socket.io';

export interface SocketUser {
    userId: string;
    email: string;
    username?: string;
}

export function authenticateSocketUser(jwtService: JwtService, client: Socket): SocketUser {
    const token = extractSocketToken(client);
    if (!token) {
        throw new UnauthorizedException('Missing token');
    }
    const payload = jwtService.verify(token) as {
        sub: string;
        email: string;
        username?: string;
    };
    return { userId: payload.sub, email: payload.email, username: payload.username };
}

function extractSocketToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
        return authToken;
    }
    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
        return authorization.slice(7);
    }
    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) {
        return null;
    }
    return cookieHeader
        .split(';')
        .map((value) => value.trim())
        .find((value) => value.startsWith('access_token='))
        ?.slice('access_token='.length) ?? null;
}
