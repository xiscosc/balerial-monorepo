/**
 * @fileoverview Ensures BreakpointStateClass instances call destroy() in onDestroy.
 * @author Your Name/Team
 */

export default {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Ensure BreakpointStateClass instances have their destroy method called in an onDestroy lifecycle hook.',
			category: 'Best Practices',
			recommended: 'warn',
			url: 'https://your-internal-docs-link-for-this-rule.com' // Optional: link to your docs
		},
		fixable: null, // Autofixing could be added later if desired
		schema: [], // No options for this rule
		messages: {
			missingDestroy:
				"Instance '{{ variableName }}' of BreakpointStateClass must call its 'destroy()' method within an onDestroy callback.",
			missingOnDestroyImport:
				"onDestroy must be imported from 'svelte' to manage BreakpointStateClass '{{ variableName }}' lifecycle.",
			onDestroyNotCalled:
				"onDestroy must be called with a callback to manage BreakpointStateClass '{{ variableName }}' lifecycle.",
			destroyNotFoundInSpecificOnDestroy:
				"BreakpointStateClass '{{ variableName }}' was instantiated, and an onDestroy hook exists, but '{{ variableName }}.destroy()' was not found inside it."
		}
	},

	create(context) {
		const breakpointClassInstances = []; // Stores { name: string, node: ASTNode }
		const onDestroyCallbacks = []; // Stores { callbackBodyNode: ASTNode, onDestroyCallNode: ASTNode, range: [number, number] }
		let onDestroyIsImported = false;

		return {
			// Check for onDestroy import
			ImportSpecifier(node) {
				if (
					node.imported.name === 'onDestroy' &&
					node.parent &&
					node.parent.type === 'ImportDeclaration' &&
					node.parent.source.value === 'svelte'
				) {
					onDestroyIsImported = true;
				}
			},

			// Track BreakpointStateClass instantiations
			NewExpression(node) {
				if (node.callee.type === 'Identifier' && node.callee.name === 'BreakpointStateClass') {
					// Expecting it to be assigned to a variable, e.g., const myInstance = new BreakpointStateClass();
					if (
						node.parent &&
						node.parent.type === 'VariableDeclarator' &&
						node.parent.id.type === 'Identifier'
					) {
						breakpointClassInstances.push({ name: node.parent.id.name, node: node.parent.id });
					}
					// Note: Could also handle cases where it's not immediately assigned, though less common for this pattern.
				}
			},

			// Find onDestroy calls and their callback bodies
			CallExpression(node) {
				if (node.callee.type === 'Identifier' && node.callee.name === 'onDestroy') {
					if (node.arguments.length > 0) {
						const callback = node.arguments[0];
						if (
							callback.type === 'ArrowFunctionExpression' ||
							callback.type === 'FunctionExpression'
						) {
							if (callback.body) {
								onDestroyCallbacks.push({
									callbackBodyNode: callback.body,
									onDestroyCallNode: node,
									range: callback.body.range // Store range for more precise checks later if needed
								});
							}
						}
					}
				}
			},

			// On exiting the script (Program node in ESLint for <script> content parsed by svelte-eslint-parser)
			'Program:exit': function () {
				if (breakpointClassInstances.length === 0) {
					return; // No instances to check, so no work to do.
				}

				// Case 1: BreakpointStateClass used, but onDestroy not imported.
				if (!onDestroyIsImported) {
					breakpointClassInstances.forEach((instance) => {
						context.report({
							node: instance.node,
							messageId: 'missingOnDestroyImport',
							data: { variableName: instance.name }
						});
					});
					return; // Further checks are pointless if onDestroy isn't available.
				}

				// Case 2: onDestroy imported, BreakpointStateClass used, but onDestroy() not called.
				if (onDestroyCallbacks.length === 0) {
					breakpointClassInstances.forEach((instance) => {
						context.report({
							node: instance.node,
							messageId: 'onDestroyNotCalled',
							data: { variableName: instance.name }
						});
					});
					return; // No onDestroy calls to check within.
				}

				// Case 3: Check if each instance's destroy() is called within an onDestroy callback.
				const destroyedInstanceNames = new Set();

				onDestroyCallbacks.forEach((onDestroyDetail) => {
					const bodyNode = onDestroyDetail.callbackBodyNode;
					let statements = [];

					if (bodyNode.type === 'BlockStatement') {
						statements = bodyNode.body;
					} else {
						// Handle concise arrow functions, e.g., onDestroy(() => myInstance.destroy())
						// The body itself is an Expression, so wrap it for uniform processing.
						statements = [{ type: 'ExpressionStatement', expression: bodyNode }];
					}

					statements.forEach((stmt) => {
						if (stmt.type === 'ExpressionStatement' && stmt.expression.type === 'CallExpression') {
							const callExpr = stmt.expression;
							if (
								callExpr.callee.type === 'MemberExpression' &&
								callExpr.callee.object.type === 'Identifier' && // The variable instance
								callExpr.callee.property.type === 'Identifier' &&
								callExpr.callee.property.name === 'destroy'
							) {
								destroyedInstanceNames.add(callExpr.callee.object.name);
							}
						}
					});
				});

				breakpointClassInstances.forEach((instance) => {
					if (!destroyedInstanceNames.has(instance.name)) {
						// Report error: destroy() not called for this instance.
						// We could try to be smarter and point to a specific onDestroy if only one exists.
						// For now, a general error on the instance declaration.
						context.report({
							node: instance.node,
							messageId: 'missingDestroy',
							data: { variableName: instance.name }
						});
					}
				});
			}
		};
	}
};
