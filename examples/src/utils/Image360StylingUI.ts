/*
 * Copyright 2023 Cognite AS
 */

import * as dat from 'dat.gui';

import { Image360UI } from './Image360UI';

import * as THREE from 'three';

export class Image360StylingUI {
  constructor(image360Ui: Image360UI, gui: dat.GUI) {
    const state = {
      color: '#ffffff',
      visible: true,
      opacity: 1
    };

    const actions = {
      addStyle: () => {
        image360Ui.collections.forEach(coll => {
          // Set default annotation style
          coll.setDefaultAnnotationStyle({
            color: new THREE.Color(state.color as THREE.ColorRepresentation).convertLinearToSRGB(),
            visible: state.visible
          });
          //THESIS ADDED CODE HERE:
          // Set opacity for each image in the collection
          coll.image360Entities.forEach(entity => {
            if (entity.image360Visualization) {
              entity.image360Visualization.opacity = state.opacity;
            } else {
              console.error(`Entity with id: ${entity.id} does not have image360Visualization property`);
            }
          });
        });
      }
    };

    gui.add(state, 'visible').name('Visible');

    gui.addColor(state, 'color').name('Color');

    gui.add(actions, 'addStyle').name('Set default style');
    gui.add(state, 'opacity', 0, 1, 0.01).name('Opacity');
  }
}
