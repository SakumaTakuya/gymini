import '@testing-library/jest-dom'

// Stub window.scrollTo for jsdom (TanStack Router scroll restoration)
window.scrollTo = () => {}
