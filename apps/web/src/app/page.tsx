'use client';

import { APP_NAME } from '@bitemap/shared';
import {
  Avatar,
  BannerOffline,
  Button,
  Card,
  Chip,
  Pin,
  SegmentedControl,
} from '@bitemap/ui';

export default function Home() {
  return (
    <main className="min-h-screen space-y-6 bg-surface p-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          BiteMap Ocean Design System
        </p>
        <h1 className="text-3xl font-semibold text-primary">Hello {APP_NAME}</h1>
      </header>

      <BannerOffline />

      <div className="flex flex-wrap gap-2">
        <Chip label="Snapper" active color="saltwater" />
        <Chip label="Whiting" color="estuarine" />
        <Chip label="Flathead" color="saltwater" />
        <Chip label="Kingfish" color="pelagic" />
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <Avatar name="Sam Bateman" />
          <div>
            <p className="text-sm font-medium">Sam Bateman</p>
            <p className="text-xs text-gray-500">Ricketts Point · 2 hours ago</p>
          </div>
          <div className="ml-auto">
            <Pin category="saltwater" />
          </div>
        </div>
      </Card>

      <SegmentedControl
        options={[
          { value: 'pins', label: 'Pins' },
          { value: 'heatmap', label: 'Heatmap' },
        ]}
        value="pins"
        onChange={() => {}}
      />

      <div className="flex gap-3">
        <Button onPress={() => {}}>Post Catch</Button>
        <Button variant="ghost" onPress={() => {}}>
          Filters
        </Button>
      </div>
    </main>
  );
}
