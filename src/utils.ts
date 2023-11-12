//array contains function
export const contains = (a: string | any[], obj: any) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === obj) {
      return true
    }
  }
  return false
}
