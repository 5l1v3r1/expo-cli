import { Compiler, compilation } from 'webpack';

import { IconOptions, ProjectOptions, generateFaviconAsync } from '@expo/pwa';
import chalk from 'chalk';
import ModifyHtmlWebpackPlugin, { HTMLLinkNode, HTMLPluginData } from './ModifyHtmlWebpackPlugin';

export default class FaviconWebpackPlugin extends ModifyHtmlWebpackPlugin {
  constructor(
    private pwaOptions: ProjectOptions & { links: HTMLLinkNode[] },
    private favicon: IconOptions | null
  ) {
    super();
  }

  async modifyAsync(
    compiler: Compiler,
    compilation: compilation.Compilation,
    data: HTMLPluginData
  ): Promise<HTMLPluginData> {
    if (!this.favicon) {
      console.log(chalk.yellow(`\u203A Favicon: No icon found, skipping auto generation`));
      return data;
    }

    const assets = await generateFaviconAsync(this.pwaOptions, this.favicon);

    const links: HTMLLinkNode[] = this.pwaOptions.links.filter(v =>
      v.rel?.split(' ').includes('icon')
    );

    for (const asset of assets) {
      const { attributes = {} } = asset.tag!;
      const faviconExists = links.some(v =>
        v.sizes ? v.sizes === attributes.sizes : v.rel?.includes('shortcut')
      );
      if (faviconExists) {
        console.log(
          chalk.magenta(
            `\u203A Favicon: Using custom <link rel="${attributes.rel}" ${
              attributes.sizes ? `sizes="${attributes.sizes}"` : ''
            } .../>`
          )
        );
      } else {
        compilation.assets[asset.asset.path] = {
          source: () => asset.asset.source,
          size: () => asset.asset.source.length,
        };
        data.assetTags.meta.push(asset.tag);
      }
    }
    return data;
  }
}
