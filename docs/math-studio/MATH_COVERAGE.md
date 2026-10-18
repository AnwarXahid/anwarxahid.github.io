# Mathematical coverage — first local release

| Operation | Solved | Exact | Checked steps | Graphable | Test | Limit |
| --- | --- | --- | --- | --- | --- | --- |
| Real linear equation | Yes | Rational output when representable | Two transformations, candidate checked | Yes | Yes | Numeric coefficients |
| Real quadratic | Yes | Rational roots when representable | Standard form and formula, candidate checked | Yes | Yes | Irrational roots displayed numerically |
| Rational polynomial equation | Yes, degree ≤2 after clearing denominators | Rational output when representable | No | Yes | Yes | Original denominator checked; no full symbolic domain analysis |
| Single square-root equation | Yes, restricted polynomial subset | Rational output when representable | No | Yes where expression is a function | Yes | Squared candidates checked in original equation |
| Linear 2×2 system | Yes | Rational output when representable | Two checked result stages | No | Yes | Unique solutions only |
| Rational polynomial simplification | Yes when denominator divides numerator | Yes for rational coefficients | Cancellation with exclusion | Yes | Yes | Exclusions shown as original denominator ≠ 0 |
| Symbolic derivative | math.js supported subset | Symbolic | No teaching steps | Yes | Yes | No full assumption/domain analysis |
| Polynomial integral | Yes | Rational coefficients | No teaching steps; derivative check | Yes | Yes | Polynomial only, degree ≤4 input |
| Definite polynomial integral | Yes | Rational output when representable | No teaching steps | Yes | Yes | Finite numeric bounds |
| Numeric matrix determinant/inverse | Yes, square ≤4×4 | Numeric | No teaching steps | No | Yes | JSON matrix input, singular inverse rejected |
| Advanced SymPy factor/expand/simplify | Optional lazy runtime | Symbolic | No teaching steps | Result may be graphable | Browser test | Downloads Pyodide/SymPy; simplification needs domain review |
| Advanced SymPy solve/integrate | Optional lazy runtime | Symbolic when returned | No teaching steps | Result may be graphable | Browser test | Real solution sets; complex roots not covered; runtime can time out |
| 2D functions | Yes | Numeric sampling | N/A | Yes | Yes | `y=f(x)` with x as variable, heuristic pole segmentation |
| 3D surfaces | Yes | Numeric sampling | N/A | Yes | Yes | `z=f(x,y)`, bounded resolution |
| Complex roots, inequalities, limits, statistics, units, nonlinear systems | No | No | No | Some functions only | Unsupported errors | Future work |

The `verified` step flag means the implementation checks the stated algebra relation or all returned candidate values for the supported rule. It is not a general formal proof certificate. Operations without rule support show an explicit no-teaching-steps message.
