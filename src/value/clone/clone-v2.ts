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
// Clonable
// ------------------------------------------------------------------
function FromObject(value: FromObject, visited: WeakSet<object>): any {
  const Acc = {} as Record<PropertyKey, unknown>
  for (const key of Object.getOwnPropertyNames(value)) {
    Acc[key] = CloneWithVisited(value[key], visited)
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    Acc[key] = CloneWithVisited(value[key], visited)
  }
  return Acc
}
function FromArray(value: FromArray, visited: WeakSet<object>): any {
  return value.map((element: any) => CloneWithVisited(element, visited))
}
function FromTypedArray(value: TypedArrayType): any {
  return value.slice()
}
function FromMap(value: Map<unknown, unknown>, visited: WeakSet<object>): any {
  return new Map(CloneWithVisited([...value.entries()], visited))
}
function FromSet(value: Set<unknown>, visited: WeakSet<object>): any {
  return new Set(CloneWithVisited([...value.entries()], visited))
}
function FromDate(value: Date): any {
  return new Date(value.toISOString())
}
function FromValue(value: ValueType): any {
  return value
}
// ------------------------------------------------------------------
// Clone with circular reference detection
// ------------------------------------------------------------------
function CloneWithVisited<T>(value: T, visited: WeakSet<object>): T {
  // Handle circular references for objects and arrays
  if ((IsObject(value) || IsArray(value) || IsMap(value) || IsSet(value)) && visited.has(value as object)) {
    // Return a reference marker or the original value to break the cycle
    // For OpenAPI schemas, returning the original reference is often acceptable
    return value
  }

  // Add to visited set before processing
  if (IsObject(value) || IsArray(value) || IsMap(value) || IsSet(value)) {
    visited.add(value as object)
  }

  if (IsArray(value)) return FromArray(value, visited)
  if (IsDate(value)) return FromDate(value)
  if (IsTypedArray(value)) return FromTypedArray(value)
  if (IsMap(value)) return FromMap(value, visited)
  if (IsSet(value)) return FromSet(value, visited)
  if (IsObject(value)) return FromObject(value, visited)
  if (IsValueType(value)) return FromValue(value)
  throw new Error('ValueClone: Unable to clone value')
}

// ------------------------------------------------------------------
// Clone
// ------------------------------------------------------------------
/** Returns a clone of the given value */
export function Clone<T>(value: T): T {
  return CloneWithVisited(value, new WeakSet<object>())
}
