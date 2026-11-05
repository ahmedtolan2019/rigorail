import { DirectionProvider as BaseDirectionProvider } from '@base-ui/react/direction-provider'

import * as React from 'react'
import { Direction } from 'radix-ui'

function DirectionProvider({
  dir,
  direction,
  children,
}: React.ComponentProps<typeof Direction.DirectionProvider> & {
  direction?: React.ComponentProps<typeof Direction.DirectionProvider>['dir']
}) {
  return (
    <Direction.DirectionProvider dir={direction ?? dir}>
      <BaseDirectionProvider direction={direction ?? dir}>
        {children}
      </BaseDirectionProvider>
    </Direction.DirectionProvider>
  )
}

const useDirection = Direction.useDirection

export { DirectionProvider, useDirection }
