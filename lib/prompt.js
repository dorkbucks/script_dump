import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'process'


export const prompt = (() => {
  let rl
  const prompt = async (msg) => await rl.question(`${msg}\n> `)
  prompt.open = () => rl = readline.createInterface({ input: stdin, output: stdout })
  prompt.close = () => rl.close()
  return prompt
})()
