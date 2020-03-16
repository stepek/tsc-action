const core = require("@actions/core")
const ts = require("typescript")
const fs = require("fs")

try {
  const PATH = "./"
  const configPath = ts.findConfigFile(PATH, ts.sys.fileExists, "tsconfig.json")

  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.")
  }

  const parseConfigHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    useCaseSensitiveFileNames: true,
  }
  const formatDiagnosticsHost = {
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: (fileName) => fileName,
    getNewLine: () => ts.sys.newLine,
  }
  const configJson = ts.readJsonConfigFile(configPath, (path) =>
    fs.readFileSync(path, "utf8"),
  )
  const config = ts.parseJsonSourceFileConfigFileContent(
    configJson,
    parseConfigHost,
    PATH,
  )
  const program = ts.createProgram(config.fileNames, config.options)
  const diagnostics = ts.getPreEmitDiagnostics(program)

  diagnostics.forEach((diagnostic) => {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      core.error(ts.formatDiagnostic(diagnostic, formatDiagnosticsHost))
    } else if (diagnostic.category === ts.DiagnosticCategory.Message) {
      core.info(ts.formatDiagnostic(diagnostic, formatDiagnosticsHost))
    } else if (
      diagnostic.category === ts.DiagnosticCategory.Warning ||
      diagnostic.category === ts.DiagnosticCategory.Suggestion
    ) {
      core.warning(ts.formatDiagnostic(diagnostic, formatDiagnosticsHost))
    }
  })

  if (
    diagnostics.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    ).length !== 0
  ) {
    throw new Error("TSC failed")
  }
} catch (error) {
  core.setFailed(error.message)
}
