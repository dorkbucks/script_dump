import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'process'


let rl

export async function prompt (msg) {
  rl = readline.createInterface({ input: stdin, output: stdout })
  const input = await rl.question(`${msg}\n> `)
  return input
}

prompt.close = () => rl.close()
