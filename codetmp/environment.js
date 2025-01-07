let environment = {
    activeEnvironment: 'development', // production or development
    
    production: {
        previewUrl: 'https://preview.codetmp7.dev/',
        previewUrlPWA: 'https://pwa.codetmp7.dev/', 
    }, 
    development: {
        previewUrl: 'https://glorious-space-robot-v6jp7v6g5wxcxw5-8001.app.github.dev/',
        previewUrlPWA: 'http://localhost:8002/', 
    }
};

export function GetEnv() {
    return environment[environment.activeEnvironment];
}