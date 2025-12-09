import NavigationFlowTest from '@/features/physical-trainer/components/test/NavigationFlowTest';
import AllBuildersNavigationTest from '@/features/physical-trainer/components/test/AllBuildersNavigationTest';

export default function TestPage() {
  return (
    <div className="space-y-8 pb-12">
      <AllBuildersNavigationTest />
      <NavigationFlowTest />
    </div>
  );
}