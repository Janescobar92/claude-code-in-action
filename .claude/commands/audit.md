Run a full security and quality audit of the project:

1. Run `npm audit` and report any vulnerabilities found.
2. Run `npm audit fix` to automatically fix vulnerabilities where possible.
3. Run `npm audit` again to show the remaining vulnerabilities after the fix.
4. Run `npm test` to verify all tests still pass.
5. Run `npm run build` to verify the project builds successfully.

Report a clear summary at the end with:
- Number of vulnerabilities fixed
- Number of vulnerabilities remaining (if any) and why they can't be auto-fixed
- Test results (passed/failed)
- Build result (success/failure)
