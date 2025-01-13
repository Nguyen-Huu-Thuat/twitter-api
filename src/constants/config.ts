import { config } from 'dotenv'
import argv from 'minimist'

const options = argv(process.argv.slice(2))
export const isProduction = Boolean(options.env === 'production')

console.log('options', options)
console.log('isProduction', isProduction)
console.log('options.env', options.env)

config({
  path: options.env ? `.env.${options.env}` : '.env'
})

export const envConfig = {
  port: (process.env.PORT as string) || 4000,
  host: process.env.HOST as string,
  clientUrl: process.env.CLIENT_URL as string
}
