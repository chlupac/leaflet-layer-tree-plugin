L.Control.LayerTreeControl.WFSSelectFeature = function (params // leafTitle, layerSettings, options, map
) {
	var feature = {
		INCLUDE_NONE: "none",
		INCLUDE_SELF: "self",
		INCLUDE_CHILDREN: "including-children",
		context: undefined,
		me: undefined,
		orderManager: undefined,
		prepare: function (layerId, parentId,
						   parentLeaf, leafTitle, leaf,
						   me, orderManager, context) {

			feature.me = me;
			feature.orderManager = orderManager;
			feature.context = context;
			if (!context.layers) {
				context.layers = {};
			}
			if (!context.layerSettings) {
				context.layerSettings = {};
			}
			if (!context.childrenCheckboxes) {
				context.childrenCheckboxes = {};
			}

			feature.incrementChildrenCheckbox(parentId, layerId, leaf);

			var parentLeafCode = parentLeaf.code;

			var checkbox = L.DomUtil.create("div", "", leafTitle);
			checkbox.name = parentLeafCode;
			checkbox.id = layerId;
			checkbox.parentId = parentId;
			checkbox.className = className + " leaflet-layer-tree-control-select-layers2 "
				+ className + "-select-layers2-" + feature.INCLUDE_NONE;
			checkbox.value = feature.INCLUDE_NONE;

			// var label = L.DomUtil.create("label", "", leafTitle);
			// var labelText = L.DomUtil.create("span", "", label);
			// labelText.innerHTML = leaf.name;

			L.DomEvent.on(checkbox, "click", function (event) {
				feature.advanceState.call(this, event, me, orderManager, leafTitle, leaf);
			});
			// L.DomEvent.on(label, "click", function (event) {
			// 	feature.advanceState.call(this, event, me, orderManager, leafTitle, leaf);
			// });
			if (leaf.selectedByDefault) {
				feature.updateCheckboxState0(checkbox, feature.INCLUDE_SELF);
				feature.toggleLayerMULTIPLE(layerId, checkbox.value, me, orderManager, leafTitle, leaf);
			}
			return parentLeafCode;
		},
		clearChildCheckboxCounter: function () {
			feature.context.childrenCheckboxes = {};
			feature.context.layerSettings = {};
			feature.context.layers = {};
		},
		incrementChildrenCheckbox: function (parentId, childId, leaf) {
			if (!feature.context.childrenCheckboxes.hasOwnProperty(parentId)) {
				feature.context.childrenCheckboxes[parentId] = new Array();
			}
			feature.context.childrenCheckboxes[parentId].push(childId);
			feature.context.layerSettings[childId] = leaf;
			feature.context.layers[childId] = {
				parentId: parentId
			};
		},
		toggleWfsLayers: function (layerSettings, map) {

		},
		calcAvailableState0: function (layerId, state) {
			var childrenCheckboxesList = feature.context.childrenCheckboxes[layerId];
			if (state == feature.INCLUDE_CHILDREN && (childrenCheckboxesList == undefined || childrenCheckboxesList.length == 0)) {
				return feature.INCLUDE_SELF;
			}
			return state;
		},
		updateCheckboxState0: function (checkbox, state) {
			checkbox.value = state;
			checkbox.className = className + " leaflet-layer-tree-control-select-layers2 "
				+ className + "-select-layers2-" + state;
		},
		updateCheckboxState: function (elementId, state) {
			var elem = document.getElementById(elementId);
			if (elem && elem.parentElement) {
				elem = feature.findControlElement(elem.parentElement);
				if (elem) {
					var nextState = feature.calcAvailableState0(elementId, state);
					feature.updateCheckboxState0(elem, nextState);
				}
			}
		},
		toggleLayerMULTIPLE: function (elementId, state, me, orderManager, leafTitle, leaf) {
			if (elementId) {
				// add or remove currently selected layer
				if (state == feature.INCLUDE_CHILDREN) {
					var childIds = feature.context.childrenCheckboxes[elementId];
					for (var i in childIds) {
						var childId = childIds[i];
						feature.toggleLayerMULTIPLE(childId, state);
						feature.updateCheckboxState(childId, state);
					}
					feature.me.addLayer(feature.context.layerSettings[elementId], elementId);
				} else if (state == feature.INCLUDE_SELF) {
					feature.me.addLayer(leaf, elementId);
					// updateCheckboxState(elementId, INCLUDE_SELF);
				} else {
					var childIds = feature.context.childrenCheckboxes[elementId];
					for (var i in childIds) {
						var childId = childIds[i];
						feature.toggleLayerMULTIPLE(childId, state);
						feature.updateCheckboxState(childId, state);
					}
					feature.me.removeLayer(elementId);
				}
				feature.orderManager.fillOrders();
			}
		},
		readCheckboxState0: function (element) {
			return element.value;
		},
		resetIncludeChildrenForParent: function (elementId) {
			var elem = document.getElementById(elementId);
			if (elem && feature.context.layers.hasOwnProperty(elementId)) {
				var elem = feature.findControlElement(elem.parentElement);
				var parentId = feature.context.layers[elementId].parentId;
				var parent = document.getElementById(parentId);
				if (parent && parent.parentElement) {
					var parent = feature.findControlElement(parent.parentElement);
					if (parent) {
						var parentState = feature.readCheckboxState0(elem);
						if (parentState == feature.INCLUDE_CHILDREN) {
							feature.updateCheckboxState0(parent, feature.INCLUDE_SELF);
							feature.resetIncludeChildrenForParent(parentId);
						}
					}
				}
			}
		},
		advanceState0: function (layerId, currentState) {
			var childrenCheckboxesList = feature.context.childrenCheckboxes[layerId];
			var nextState = feature.INCLUDE_NONE;
			if (currentState == feature.INCLUDE_NONE) {
				nextState = feature.INCLUDE_SELF;
			} else if (childrenCheckboxesList != undefined && childrenCheckboxesList.length > 0 &&
				currentState == feature.INCLUDE_SELF) {
				nextState = feature.INCLUDE_CHILDREN;
			}
			return nextState;
		},
		findControlElement: function (elements) {
			var checkbox = undefined;
			for (var i in elements) {
				if (elements[i] && elements[i].className) {
					var cls = elements[i].className;
					if (cls != undefined && cls.indexOf(className + " leaflet-layer-tree-control-select-layers2") > -1) {
						checkbox = elements[i];
						break;
					}
				}
			}
			return checkbox;
		}, advanceState: function (event, me, orderManager, leafTitle, leaf) {
			var elem = event.srcElement != undefined ? event.srcElement : this;
			var checkbox = feature.findControlElement(elem.parentElement.parentElement.getElementsByTagName("div"));
			var elementId = checkbox.id;
			var currentState = checkbox.value;
			var nextState = feature.advanceState0(elementId, currentState);
			feature.updateCheckboxState0(checkbox, nextState);
			feature.resetIncludeChildrenForParent(elementId);
			feature.toggleLayerMULTIPLE(elementId, nextState, me, orderManager, leafTitle, leaf);
		},
		addWfsSelectFeatureButton: function (params) {
			feature.prepare(
				params.layerId,
				params.parentId,
				params.parentLeaf,
				params.leafTitle,
				params.leaf,
				params.me,
				params.orderManager,
				params.context
			);
		}
	}
	feature.addWfsSelectFeatureButton(params);
}
