module.exports = {
  docs: [
    {
      type: 'doc',
      id: 'overview',
    },
    {
      type: 'doc',
      id: 'installation',
    },
    {
      type: 'doc',
      id: 'migration-guide',
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: false,
      items: [
        'examples/cad-basic',
        'examples/pointcloud',
        {
          "Styling CAD models": [
            'examples/cad-styling',
            'examples/cad-styling-assets',
            'examples/cad-styling-nodes',
            'examples/cad-styling-custom',
          ]
        },
        'examples/pointcloud-styling',
        'examples/cad-prioritized-nodes',
        'examples/cad-transform-override',
        'examples/cad-2doverlay',
        'examples/cad-3dobjects',
        'examples/node-visiting',
        'examples/clipping',
        'examples/cad-save-viewerstate',
        'examples/click-reactions-cad',
        'examples/click-reactions-pointcloud',
        'examples/antialiasing',
        'examples/axisviewtool',
        'examples/timelinetool',
        'examples/combine-models',
        'examples/controlsmodes',
        'examples/point-to-point-measurement',
      ],
    },
    {
      type: 'doc',
      id: 'concepts',
    },
    {
      type: 'category',
      label: 'Extending Reveal',
      collapsed: false,
      items: [
        'extending/datasource',
        'extending/camera-manager'
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: true,
      items: [
        {
          type: 'autogenerated',
          dirName: 'api'
        },
      ]
    },
    {
      type: 'link',
      href: 'https://github.com/cognitedata/reveal/releases',
      label: 'Release notes',
    },
  ],
};
