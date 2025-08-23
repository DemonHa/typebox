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
      
      // Calculate performance ratios compared to original
      let amritRatio = 'N/A'
      let v2Ratio = 'N/A'
      let v3Ratio = 'N/A'
      
      if (!result.original_clone.note) {
        const originalOps = result.original_clone.iterations / (result.original_clone.completed / 1000)
        const amritOps = result.amrit_clone.iterations / (result.amrit_clone.completed / 1000)
        const v2Ops = result.v2_clone.iterations / (result.v2_clone.completed / 1000)
        const v3Ops = result.v3_clone.iterations / (result.v3_clone.completed / 1000)
        
        const amritMultiplier = amritOps / originalOps
        const v2Multiplier = v2Ops / originalOps
        const v3Multiplier = v3Ops / originalOps
        
        amritRatio = amritMultiplier >= 1 
          ? `${amritMultiplier.toFixed(2)}x faster`
          : `${(1/amritMultiplier).toFixed(2)}x slower`
        
        v2Ratio = v2Multiplier >= 1 
          ? `${v2Multiplier.toFixed(2)}x faster`
          : `${(1/v2Multiplier).toFixed(2)}x slower`
          
        v3Ratio = v3Multiplier >= 1 
          ? `${v3Multiplier.toFixed(2)}x faster`
          : `${(1/v3Multiplier).toFixed(2)}x slower`
      }
      
      return {
        ...acc,
        [result.type.padEnd(30, ' ')]: {
          'Original (ms)': originalTime.padStart(12),
          'Amrit (ms)': `${result.amrit_clone.completed} ms`.padStart(10),
          'Amrit V2 (ms)': `${result.v2_clone.completed} ms`.padStart(12),
          'Amrit V3 (ms)': `${result.v3_clone.completed} ms`.padStart(12),
          'Amrit vs Original': amritRatio.padStart(15),
          'Amrit V2 vs Original': v2Ratio.padStart(15),
          'Amrit V3 vs Original': v3Ratio.padStart(15),
        },
      }
    }, {}),
  )
}

console.log('\n=== Clone Implementation Comparison ===')
presentCloneComparison([...CloneBenchmark.ExecuteCloneComparative()])