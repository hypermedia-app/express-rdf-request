import { describe, it } from 'mocha'
import { expect } from 'chai'
import index from '../src'

describe('index', () => {
  it('exports foo', () => {
    expect(index).to.eq('foo')
  })
})
