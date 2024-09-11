import argv from 'minimist'

const options = argv(process.argv.slice(2))

console.log(options)

export const isProduction = Boolean(options.production)

console.log(isProduction)
console.log(options.env)

export const envConfig = {
  port: process.env.PORT as string,
  host: process.env.HOST as string,
  clientUrl: process.env.CLIENT_URL as string
}
