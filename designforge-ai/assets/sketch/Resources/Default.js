// See https://developer.sketch.com/reference/api
const sketch = require('sketch')
const document = sketch.getSelectedDocument()

console.log('The Stacks Report:')

document.pages.forEach(page => {
  const stacks = sketch.find('Frame', page).filter(frame => frame.stackLayout)
  const cursor = page.isEqual(document.selectedPage) ? "  •  " : "  ◦  "
  const pageName = page.name.slice(0, 20).padEnd(20, '.')
  console.log(`${cursor}${pageName}: ${stacks.length} Stacks`)
})
