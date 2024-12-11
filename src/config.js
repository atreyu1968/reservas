export const SERVER_CONFIG = {
  IP: 'localhost',
  PORT: 3000,
  get BASE_URL() {
    return `http://${this.IP}:${this.PORT}`;
  }
};