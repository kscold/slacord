/**
 * PM2 Ecosystem Configuration for Slacord Backend
 * Raspberry Pi 서버에서 실행될 PM2 설정
 */

module.exports = {
    apps: [
        {
            name: 'slacord-backend',
            script: 'dist/main.js',
            cwd: '/home/pi/slacord',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M', // Raspberry Pi 메모리 제한 고려
            env: {
                NODE_ENV: 'production',
                PORT: 8082,
            },
            error_file: '/home/pi/slacord/logs/error.log',
            out_file: '/home/pi/slacord/logs/out.log',
            log_file: '/home/pi/slacord/logs/combined.log',
            time: true,
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};
