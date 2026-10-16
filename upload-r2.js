const fs = require('fs')
const { spawnSync } = require('child_process')
const path = require('path')

const envFile = path.join(process.cwd(), '.env.local')

if (!fs.existsSync(envFile)) {
  console.error('Не найден .env.local. Запусти скрипт из папки проекта.')
  process.exit(1)
}

const config = {}

for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*(R2_ACCOUNT_ID|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|R2_BUCKET_NAME|R2_ENDPOINT)\s*=\s*(.*)\s*$/)
  if (match) {
    config[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
}

const required = [
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_ENDPOINT',
]

for (const name of required) {
  if (!config[name]) {
    console.error(`Не задан параметр ${name} в .env.local`)
    process.exit(1)
  }
}

const file = process.argv[2]
const objectKey = process.argv[3]

if (!file || !objectKey) {
  console.error('Использование: node upload-r2.js "/путь/к/фильму.mp4" "movies/имя-файла.mp4"')
  process.exit(1)
}

if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
  console.error('Файл не найден. Проверь путь к видео.')
  process.exit(1)
}

const env = {
  ...process.env,
  AWS_ACCESS_KEY_ID: config.R2_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: config.R2_SECRET_ACCESS_KEY,
  AWS_DEFAULT_REGION: 'auto',
}

console.log(`Файл: ${path.basename(file)}`)
console.log(`Размер: ${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} МБ`)
console.log(`Бакет: ${config.R2_BUCKET_NAME}`)
console.log(`Объект: ${objectKey}`)
console.log('Начинаю загрузку...')

const result = spawnSync(
  'aws',
  [
    's3', 'cp', file,
    `s3://${config.R2_BUCKET_NAME}/${objectKey}`,
    '--endpoint-url', config.R2_ENDPOINT,
    '--only-show-errors',
  ],
  { env, stdio: 'inherit' }
)

if (result.error) {
  console.error('Не удалось запустить AWS CLI:', result.error.message)
  process.exit(1)
}

if (result.status !== 0) {
  console.error('Загрузка не завершена. Проверь настройки R2 и попробуй ещё раз.')
  process.exit(result.status || 1)
}

console.log('Загрузка завершена успешно.')
