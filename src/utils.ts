//array contains function
export const contains = (array: Array<unknown>, object: unknown) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === object) {
      return true
    }
  }
  return false
}

export const uniqueArray = (array: Array<number>): Array<number> => {
  const temp: Record<number, unknown> = {}
  for (let i = 0; i < array.length; i++) temp[array[i]] = true
  const record: number[] = []
  for (const k in temp) record.push(Number(k))
  return record
}
