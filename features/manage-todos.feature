
Feature: Manage TODOs

As a busy person
I want to keep TODOs in a list
In order to stop worrying about them

Scenario: Add an item
  When I add TODO "remove dead code"
  Then the new TODO is on the list

@wip
Scenario: Remove an item
  Given I have a TODO "remove dead code"
  When I remove TODO "remove dead code"
  Then the removed TODO is not in the list
