export function writeCssNumber(
  element: HTMLElement,
  variableName: string,
  nextValue: number,
  cache: Map<string, string>
) {
  const serialized = nextValue.toFixed(4)
  if (cache.get(variableName) === serialized) {
    return
  }

  cache.set(variableName, serialized)
  element.style.setProperty(variableName, serialized)
}
