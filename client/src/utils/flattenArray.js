
// shallow
export default function flattenArray(array) {
  return array.reduce((a, b) => {
    if(Array.isArray(b)) {
      a.push(...b);
    } else {
      a.push(b);
    }
    return a;
  }, []);
}
