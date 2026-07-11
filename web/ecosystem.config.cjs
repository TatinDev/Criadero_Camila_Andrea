module.exports = {
  apps: [{
    name: "criadero-camila-andrea",
    script: "server.mjs",
    env: {
      NODE_ENV: "production",
      PORT: 4177,
      DATA_FILE: "/var/lib/criadero-camila-andrea/db.json",
      UPLOADS_DIR: "/var/lib/criadero-camila-andrea/uploads",
    },
    instances: 1,
    exec_mode: "fork",
    max_memory_restart: "256M",
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
  }],
};
