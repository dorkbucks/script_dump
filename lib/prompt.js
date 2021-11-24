import * as readline from 'node:readline/promises'
import { stdin, stdout } from 'process'


export const prompt = (() => {
  let rl
  let char = '>'
  const prompt = async (msg) => await rl.question(`${msg}\n${char} `)
  prompt.char = (c) => char = c
  prompt.open = () => rl = readline.createInterface({ input: stdin, output: stdout })
  prompt.close = () => rl.close()
  return prompt
})()
