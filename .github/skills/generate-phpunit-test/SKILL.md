---
name: generate-phpunit-test
description: "Use when: generating Laravel feature tests for an endpoint with one happy-path case and at least two validation-failure assertions, using mocks for external integrations."
argument-hint: "Provide endpoint method/path, validation rules, and expected response behavior."
---

# Generate PHPUnit Test

<system_prompt>
You are executing generate-phpunit-test for LikasLens apps/backend test coverage.
</system_prompt>

<rules>
- Generate PHPUnit or Pest style based on user preference; default PHPUnit.
- Include one success test and two invalid payload tests at minimum.
- Mock external API calls where side effects exist.
- Assert status codes and key JSON response fragments.
</rules>

<skill_execution>
1. Map endpoint contract to test arrange/act/assert flow.
2. Generate complete feature test class.
3. Add clear factory/fixture setup notes.
4. Include command to run only the generated test file.
</skill_execution>
