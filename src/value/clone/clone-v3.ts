/*--------------------------------------------------------------------------

@sinclair/typebox/value

The MIT License (MIT)

Copyright (c) 2017-2025 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import type { ObjectType as FromObject, ArrayType as FromArray, TypedArrayType, ValueType } from '../guard/index'

// ------------------------------------------------------------------
// ValueGuard
// ------------------------------------------------------------------
import { IsArray, IsDate, IsMap, IsSet, IsObject, IsTypedArray, IsValueType } from '../guard/index'

// ------------------------------------------------------------------
// Fast Clone V3 - Optimized for speed while maintaining circular reference support
// ------------------------------------------------------------------

// Fast path for primitives - no circular reference check needed
function CloneFast<T>(value: T): T {
  // Inline primitive check for maximum speed
  if (value === null || value === undefined) return value
  const type = typeof value
  if (type === 'string' || type === 'number' || type === 'boolean' || type === 'bigint' || type === 'symbol') {
    return value
  }
  
  if (IsArray(value)) {
    const arr = value as unknown[]
    const result = new Array(arr.length)
    for (let i = 0; i < arr.length; i++) {
      result[i] = CloneFast(arr[i])
    }
    return result as T
  }
  
  if (IsDate(value)) return new Date((value as Date).getTime()) as T
  if (IsTypedArray(value)) return (value as TypedArrayType).slice() as T
  
  if (IsMap(value)) {
    const map = value as Map<unknown, unknown>
    const cloned = new Map()
    for (const [key, val] of map) {
      cloned.set(CloneFast(key), CloneFast(val))
    }
    return cloned as T
  }
  
  if (IsSet(value)) {
    const set = value as Set<unknown>
    const cloned = new Set()
    for (const item of set) {
      cloned.add(CloneFast(item))
    }
    return cloned as T
  }
  
  if (IsObject(value)) {
    const obj = value as FromObject
    const cloned = {} as Record<PropertyKey, unknown>
    
    // Fast path for simple objects - use Object.keys for better performance
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      cloned[key] = CloneFast(obj[key])
    }
    
    // Handle symbol properties only if they exist (uncommon case)
    const symbols = Object.getOwnPropertySymbols(obj)
    if (symbols.length > 0) {
      for (let i = 0; i < symbols.length; i++) {
        const sym = symbols[i]
        cloned[sym] = CloneFast(obj[sym])
      }
    }
    return cloned as T
  }
  
  throw new Error('ValueClone: Unable to clone value')
}

// Slow path with circular reference detection - only used when needed
function CloneWithCircularCheck<T>(value: T, visited: WeakSet<object>): T {
  // Early return for primitives
  if (IsValueType(value)) return value
  
  // Check for circular references only for objects that can contain them
  const isComplexObject = IsObject(value) || IsArray(value) || IsMap(value) || IsSet(value)
  if (isComplexObject) {
    if (visited.has(value as object)) {
      return value // Return original reference to break cycle
    }
    visited.add(value as object)
  }

  if (IsArray(value)) {
    const arr = value as FromArray
    const result = new Array(arr.length)
    for (let i = 0; i < arr.length; i++) {
      result[i] = CloneWithCircularCheck(arr[i], visited)
    }
    return result as T
  }
  
  if (IsDate(value)) return new Date((value as Date).getTime()) as T
  if (IsTypedArray(value)) return (value as TypedArrayType).slice() as T
  
  if (IsMap(value)) {
    const map = value as Map<unknown, unknown>
    const cloned = new Map()
    for (const [key, val] of map) {
      cloned.set(CloneWithCircularCheck(key, visited), CloneWithCircularCheck(val, visited))
    }
    return cloned as T
  }
  
  if (IsSet(value)) {
    const set = value as Set<unknown>
    const cloned = new Set()
    for (const item of set) {
      cloned.add(CloneWithCircularCheck(item, visited))
    }
    return cloned as T
  }
  
  if (IsObject(value)) {
    const obj = value as FromObject
    const cloned = {} as Record<PropertyKey, unknown>
    // Use for...in for better performance
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = CloneWithCircularCheck(obj[key], visited)
      }
    }
    // Handle symbol properties
    const symbols = Object.getOwnPropertySymbols(obj)
    if (symbols.length > 0) {
      for (const sym of symbols) {
        cloned[sym] = CloneWithCircularCheck(obj[sym], visited)
      }
    }
    return cloned as T
  }
  
  throw new Error('ValueClone: Unable to clone value')
}

// Quick check for potential circular references
function MightHaveCircularRefs(value: unknown): boolean {
  // Only complex objects can have circular references
  if (!IsObject(value) && !IsArray(value) && !IsMap(value) && !IsSet(value)) return false
  
  // For arrays, only check if they're large or contain objects
  if (IsArray(value)) {
    const arr = value as unknown[]
    // Small arrays with only primitives are very unlikely to have circular refs
    if (arr.length <= 5) {
      return arr.some(item => IsObject(item) || IsArray(item) || IsMap(item) || IsSet(item))
    }
    // Larger arrays might have circular refs if they contain complex objects
    return arr.length > 20 || arr.some(item => IsObject(item) || IsArray(item) || IsMap(item) || IsSet(item))
  }
  
  // For objects, be more aggressive about using fast path
  if (IsObject(value)) {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)
    
    // Very small objects are unlikely to have circular refs
    if (keys.length <= 3) {
      return keys.some(key => {
        const val = obj[key]
        return IsObject(val) || IsArray(val) || IsMap(val) || IsSet(val)
      })
    }
    
    // Medium objects only if they have nested complex objects
    if (keys.length <= 10) {
      let complexCount = 0
      for (const key of keys) {
        const val = obj[key]
        if (IsObject(val) || IsArray(val) || IsMap(val) || IsSet(val)) {
          complexCount++
          if (complexCount > 2) return true // More than 2 nested objects might be circular
        }
      }
      return false
    }
    
    // Large objects are more likely to have circular refs
    return true
  }
  
  // Maps and Sets are less likely to have circular refs in typical usage
  if (IsMap(value)) {
    const map = value as Map<unknown, unknown>
    return map.size > 10
  }
  
  if (IsSet(value)) {
    const set = value as Set<unknown>
    return set.size > 10
  }
  
  return false
}

// ------------------------------------------------------------------
// Clone V3 - Smart path selection
// ------------------------------------------------------------------
/** Returns a clone of the given value - V3 optimized version */
export function Clone<T>(value: T): T {
  // Fast path: if unlikely to have circular references, skip the overhead
  if (!MightHaveCircularRefs(value)) {
    return CloneFast(value)
  }
  
  // Slow path: use circular reference detection
  return CloneWithCircularCheck(value, new WeakSet<object>())
}
