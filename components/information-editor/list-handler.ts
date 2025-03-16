// Suchen Sie nach dieser Zeile:
// .startsWith(listType === "ul" ? "• " : /^\d+\.\s/.test(currentLine.line.trim()))

// Und ersetzen Sie sie durch eine der folgenden Optionen:

// Option 1: Verwenden Sie eine Bedingung, die immer einen String zurückgibt
//.startsWith(listType === "ul" ? "• " : "")

// ODER

// Option 2: Verwenden Sie eine andere Logik, die den gleichen Zweck erfüllt
// Wenn listType === "ul", prüfen wir auf "• "
// Wenn listType !== "ul", prüfen wir auf nummerierte Listen mit einem Regex
//if ((listType === "ul" && currentLine.line.trim().startsWith("• ")) ||
//    (listType !== "ul" && /^\d+\.\s/.test(currentLine.line.trim())))

