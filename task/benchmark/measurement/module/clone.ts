import { Cases } from './cases'
import { Benchmark } from './benchmark'
import { Value } from '@sinclair/typebox/value'
import { TSchema, TypeGuard } from '@sinclair/typebox'
import { Clone as CloneAmrit } from '../../../../src/value/clone/clone'
import { Clone as CloneOriginal } from '../../../../src/value/clone/clone-original'
import { Clone as CloneV2 } from '../../../../src/value/clone/clone-v2'
import { Clone as CloneV3 } from '../../../../src/value/clone/clone-v3'

export namespace CloneBenchmark {
  // Test data for different scenarios
  const TestData = {
    // Primitives
    primitive_null: null,
    primitive_undefined: undefined,
    primitive_number: 42,
    primitive_bigint: 123456789012345678901234567890n,
    primitive_boolean: true,
    primitive_string: 'Hello, World!',
    primitive_symbol: Symbol('test'),

    // Simple objects
    simple_object: { a: 1, b: 'hello', c: true },
    
    // Arrays
    simple_array: [1, 2, 3, 4, 5],
    nested_array: [[1, 2], [3, 4], [5, 6]],
    mixed_array: [1, 'hello', true, { x: 10 }, [1, 2, 3]],

    // Complex nested objects
    complex_object: {
      id: 'user123',
      profile: {
        name: 'John Doe',
        age: 30,
        preferences: {
          theme: 'dark',
          notifications: true,
          languages: ['en', 'es', 'fr']
        }
      },
      posts: [
        { id: 1, title: 'First Post', tags: ['tech', 'javascript'] },
        { id: 2, title: 'Second Post', tags: ['programming', 'typescript'] }
      ]
    },

    // Typed arrays
    int8_array: new Int8Array([1, 2, 3, 4, 5]),
    uint8_array: new Uint8Array([10, 20, 30, 40, 50]),
    float32_array: new Float32Array([1.1, 2.2, 3.3, 4.4, 5.5]),
    float64_array: new Float64Array([1.111, 2.222, 3.333, 4.444, 5.555]),

    // Date objects
    date_object: new Date('2024-01-01T12:00:00Z'),

    // Maps and Sets
    map_simple: new Map([['key1', 'value1'], ['key2', 'value2'], ['key3', 'value3']]),
    map_complex: new Map([
      ['user1', { name: 'Alice', age: 25 }],
      ['user2', { name: 'Bob', age: 30 }],
      ['42', { type: 'number-key', value: true }]
    ]),
    set_simple: new Set([1, 2, 3, 4, 5]),
    set_complex: new Set([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]),

    // Large data structures
    large_array: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item_${i}` })),
    large_object: Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [`prop_${i}`, { nested: { value: i * 2 } }])
    ),

    // Circular reference test data (created separately to avoid issues)
    get circular_object() {
      const obj: any = { a: 1, b: 'hello' };
      obj.self = obj;
      return obj;
    },

    get circular_array() {
      const arr: any = [1, 2, 3];
      arr.push(arr);
      return arr;
    }
  }

  function MeasureClone(name: string, data: any, iterations: number = 100_000) {
    console.log('CloneBenchmark.MeasureClone(', name, ')')
    
    const result = Benchmark.Measure(() => {
      Value.Clone(data)
    }, iterations)

    return { type: name, ...result }
  }

  function MeasureCloneAmrit(name: string, data: any, iterations: number = 100_000) {
    console.log('CloneBenchmark.MeasureCloneAmrit(', name, ')')
    
    const result = Benchmark.Measure(() => {
      CloneAmrit(data)
    }, iterations)

    return { type: `${name}_amrit_clone`, ...result }
  }

  function MeasureCloneOriginal(name: string, data: any, iterations: number = 100_000) {
    console.log('CloneBenchmark.MeasureCloneOriginal(', name, ')')
    
    const result = Benchmark.Measure(() => {
      CloneOriginal(data)
    }, iterations)

    return { type: `${name}_original_clone`, ...result }
  }

  function MeasureCloneV2(name: string, data: any, iterations: number = 100_000) {
    console.log('CloneBenchmark.MeasureCloneV2(', name, ')')
    
    const result = Benchmark.Measure(() => {
      CloneV2(data)
    }, iterations)

    return { type: `${name}_v2_clone`, ...result }
  }

  function MeasureCloneV3(name: string, data: any, iterations: number = 100_000) {
    console.log('CloneBenchmark.MeasureCloneV3(', name, ')')
    
    const result = Benchmark.Measure(() => {
      CloneV3(data)
    }, iterations)

    return { type: `${name}_v3_clone`, ...result }
  }

  function MeasureCloneWithValidation(name: string, data: any, iterations: number = 100_000) {
    console.log('CloneBenchmark.MeasureCloneWithValidation(', name, ')')
    
    // Pre-clone to verify correctness
    const cloned = Value.Clone(data)
    const isValid = JSON.stringify(data) === JSON.stringify(cloned) || 
                   (data === cloned) || // for primitives
                   (data instanceof Date && cloned instanceof Date && data.getTime() === cloned.getTime()) ||
                   (data instanceof Map && cloned instanceof Map && data.size === cloned.size) ||
                   (data instanceof Set && cloned instanceof Set && data.size === cloned.size)

    if (!isValid && typeof data === 'object' && data !== null && !data.self && !Array.isArray(data) || !data.includes?.(data)) {
      console.warn(`Clone validation failed for ${name}`)
    }

    const result = Benchmark.Measure(() => {
      Value.Clone(data)
    }, iterations)

    return { type: name, valid: isValid, ...result }
  }

  export function* Execute() {
    // Primitive types - high iteration count
    yield MeasureClone('primitive_null', TestData.primitive_null, 1_000_000)
    yield MeasureClone('primitive_undefined', TestData.primitive_undefined, 1_000_000)
    yield MeasureClone('primitive_number', TestData.primitive_number, 1_000_000)
    yield MeasureClone('primitive_bigint', TestData.primitive_bigint, 1_000_000)
    yield MeasureClone('primitive_boolean', TestData.primitive_boolean, 1_000_000)
    yield MeasureClone('primitive_string', TestData.primitive_string, 1_000_000)
    yield MeasureClone('primitive_symbol', TestData.primitive_symbol, 1_000_000)

    // Simple structures - medium iteration count
    yield MeasureClone('simple_object', TestData.simple_object, 500_000)
    yield MeasureClone('simple_array', TestData.simple_array, 500_000)
    yield MeasureClone('nested_array', TestData.nested_array, 300_000)
    yield MeasureClone('mixed_array', TestData.mixed_array, 300_000)

    // Complex structures - lower iteration count
    yield MeasureClone('complex_object', TestData.complex_object, 100_000)

    // Typed arrays - medium iteration count
    yield MeasureClone('int8_array', TestData.int8_array, 500_000)
    yield MeasureClone('uint8_array', TestData.uint8_array, 500_000)
    yield MeasureClone('float32_array', TestData.float32_array, 500_000)
    yield MeasureClone('float64_array', TestData.float64_array, 500_000)

    // Date objects
    yield MeasureClone('date_object', TestData.date_object, 500_000)

    // Maps and Sets - lower iteration count due to complexity
    yield MeasureClone('map_simple', TestData.map_simple, 200_000)
    yield MeasureClone('map_complex', TestData.map_complex, 100_000)
    yield MeasureClone('set_simple', TestData.set_simple, 200_000)
    yield MeasureClone('set_complex', TestData.set_complex, 100_000)

    // Large structures - very low iteration count
    yield MeasureClone('large_array', TestData.large_array, 1_000)
    yield MeasureClone('large_object', TestData.large_object, 1_000)

    // Circular references - low iteration count
    yield MeasureClone('circular_object', TestData.circular_object, 50_000)
    yield MeasureClone('circular_array', TestData.circular_array, 50_000)

    // TypeBox schema-generated data
    for (const [type, schema] of Object.entries(Cases)) {
      if (!TypeGuard.IsSchema(schema)) continue
      try {
        const data = Value.Create(schema)
        yield MeasureClone(`schema_${type}`, data, 50_000)
      } catch (error) {
        console.warn(`Failed to create data for schema ${type}:`, error)
      }
    }
  }

  // Comparative benchmark between all three clone implementations
  export function* ExecuteCloneComparative() {
    // Test cases that work with all implementations (no circular references)
    const allImplementationsTestCases = [
      ['primitive_number', TestData.primitive_number, 1_000_000],
      ['primitive_string', TestData.primitive_string, 1_000_000],
      ['simple_object', TestData.simple_object, 500_000],
      ['complex_object', TestData.complex_object, 100_000],
      ['simple_array', TestData.simple_array, 500_000],
      ['nested_array', TestData.nested_array, 300_000],
      ['mixed_array', TestData.mixed_array, 300_000],
      ['date_object', TestData.date_object, 500_000],
      ['map_simple', TestData.map_simple, 200_000],
      ['set_simple', TestData.set_simple, 200_000],
      ['large_array', TestData.large_array, 1_000]
    ] as const

    // Test cases with circular references (only for Amrit and V2 implementations)
    const circularTestCases = [
      ['circular_object', TestData.circular_object, 50_000],
      ['circular_array', TestData.circular_array, 50_000]
    ] as const

    // Run tests that work with all implementations
    for (const [name, data, iterations] of allImplementationsTestCases) {
      console.log('CloneBenchmark.CloneComparative(', name, ')')
      
      // Amrit Clone (current implementation)
      const amritResult = Benchmark.Measure(() => {
        CloneAmrit(data)
      }, iterations)

      // Original Clone
      const originalResult = Benchmark.Measure(() => {
        CloneOriginal(data)
      }, iterations)

      // V2 Clone
      const v2Result = Benchmark.Measure(() => {
        CloneV2(data)
      }, iterations)

      // V3 Clone
      const v3Result = Benchmark.Measure(() => {
        CloneV3(data)
      }, iterations)

      yield {
        type: `clone_comparison_${name}`,
        amrit_clone: amritResult,
        original_clone: originalResult,
        v2_clone: v2Result,
        v3_clone: v3Result
      }
    }

    // Run circular reference tests only for implementations that support them
    for (const [name, data, iterations] of circularTestCases) {
      console.log('CloneBenchmark.CloneComparative(', name, ') - Circular Reference Test')
      
      // Amrit Clone (current implementation)
      const amritResult = Benchmark.Measure(() => {
        CloneAmrit(data)
      }, iterations)

      // V2 Clone
      const v2Result = Benchmark.Measure(() => {
        CloneV2(data)
      }, iterations)

      // V3 Clone
      const v3Result = Benchmark.Measure(() => {
        CloneV3(data)
      }, iterations)

      yield {
        type: `clone_comparison_${name}`,
        amrit_clone: amritResult,
        original_clone: { completed: 0, iterations: 0, note: 'N/A - No circular reference support' },
        v2_clone: v2Result,
        v3_clone: v3Result
      }
    }
  }

  // Comparative benchmark against native JSON methods
  export function* ExecuteComparative() {
    const testCases = [
      ['simple_object', TestData.simple_object],
      ['complex_object', TestData.complex_object],
      ['simple_array', TestData.simple_array],
      ['nested_array', TestData.nested_array]
    ] as const

    for (const [name, data] of testCases) {
      console.log('CloneBenchmark.Comparative(', name, ')')
      
      const iterations = 100_000

      // TypeBox Clone (Amrit implementation)
      const typeboxResult = Benchmark.Measure(() => {
        CloneAmrit(data)
      }, iterations)

      // JSON.parse(JSON.stringify()) - common but limited approach
      const jsonResult = Benchmark.Measure(() => {
        JSON.parse(JSON.stringify(data))
      }, iterations)

      // Structured clone (if available)
      let structuredResult = null
      if (typeof structuredClone !== 'undefined') {
        structuredResult = Benchmark.Measure(() => {
          structuredClone(data)
        }, iterations)
      }

      yield {
        type: `comparative_${name}`,
        typebox: typeboxResult,
        json: jsonResult,
        structured: structuredResult
      }
    }
  }
}
