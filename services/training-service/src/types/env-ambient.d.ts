declare module 'helmet' {
  const helmet: any;
  export default helmet;
}

declare module 'dotenv' {
  const dotenv: { config: (...args: any[]) => void };
  export default dotenv;
}

declare module 'socket.io' {
  export const Server: any;
  const defaultExport: any;
  export default defaultExport;
}






