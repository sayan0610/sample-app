import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'grpc-web',
      'google-protobuf',
      'proto-stubs/tasks_grpc_web_pb.js',
      'proto-stubs/tasks_pb.js'
    ]
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});
