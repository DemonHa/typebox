import { CompileBenchmark } from './compile'
import { CheckBenchmark } from './check'
import { CloneBenchmark } from './clone'
import { Result } from './result'

export function present(results: Result[]) {
  console.table(
    results.reduce((acc, result) => {
      const ratio = result.ajv.completed / result.compiler.completed
      if (result.value) {
        return {
          ...acc,
          [result.type.padEnd(26, ' ')]: {
            Iterations: result.compiler.iterations,
            ValueCheck: `${result.value.completed} ms`.padStart(10),
            Ajv: `${result.ajv.completed} ms`.padStart(10),
            TypeCompiler: `${result.compiler.completed} ms`.padStart(10),
            Performance: `${ratio.toFixed(2)} x`.padStart(10, ' '),
          },
        }
      } else {
        return {
          ...acc,
          [result.type.padEnd(26, ' ')]: {
            Iterations: result.compiler.iterations,
            Ajv: `${result.ajv.completed} ms`.padStart(10),
            TypeCompiler: `${result.compiler.completed} ms`.padStart(10),
            Performance: `${ratio.toFixed(2)} x`.padStart(10, ' '),
          },
        }
      }
    }, {}),
  )
}

// present([...CompileBenchmark.Execute()])
// present([...CheckBenchmark.Execute()])

// Present clone benchmark results separately
function presentClone(results: any[]) {
  console.table(
    results.reduce((acc, result) => {
      return {
        ...acc,
        [result.type.padEnd(26, ' ')]: {
          Iterations: result.iterations,
          'Time (ms)': `${result.completed} ms`.padStart(10),
          'Ops/sec': `${Math.round(result.iterations / (result.completed / 1000))}`.padStart(10),
        },
      }
    }, {}),
  )
}

console.log('\n=== Clone Benchmark Results ===')
presentClone([...CloneBenchmark.Execute()])

// Present clone comparison results
function presentCloneComparison(results: any[]) {
  console.table(
    results.reduce((acc, result) => {
      const originalTime = result.original_clone.note ? 'N/A' : `${result.original_clone.completed} ms`
      const originalOps = result.original_clone.note ? 'N/A' : `${Math.round(result.original_clone.iterations / (result.original_clone.completed / 1000))}`
      
      return {
        ...acc,
        [result.type.padEnd(30, ' ')]: {
          'Original Clone (ms)': originalTime.padStart(18),
          'Amrit Clone (ms)': `${result.amrit_clone.completed} ms`.padStart(15),
          'Amrit V2 Clone (ms)': `${result.v2_clone.completed} ms`.padStart(12),
          'Original Ops/sec': originalOps.padStart(15),
          'Amrit Ops/sec': `${Math.round(result.amrit_clone.iterations / (result.amrit_clone.completed / 1000))}`.padStart(12),
          'Amrit V2 Ops/sec': `${Math.round(result.v2_clone.iterations / (result.v2_clone.completed / 1000))}`.padStart(10),
        },
      }
    }, {}),
  )
}

console.log('\n=== Clone Implementation Comparison ===')
presentCloneComparison([...CloneBenchmark.ExecuteCloneComparative()])