export function logger(fileName: string, fnName:string | undefined,  message: string, level: 'error' | 'debug') {
    switch (level) {
      case 'error':
        console.error(`[${fileName}] - [${fnName}] - ${message}`)
        break;
      case 'debug':
        console.debug(`[${fileName}] - [${fnName}] - ${message}`)
        break;
    }
  }