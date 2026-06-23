import prisma from '../config/db';

export const initializeCleanupJobs = () => {
  console.log('Initializing background cleanup jobs...');

  // Run cleanup routine every hour (simulated)
  setInterval(async () => {
    try {
      console.log('Running background test-attempt cleanup...');
      
      // Auto-abandon test attempts that started more than 4 hours ago and are still IN_PROGRESS
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      
      const result = await prisma.testAttempt.updateMany({
        where: {
          status: 'IN_PROGRESS',
          startTime: {
            lt: fourHoursAgo
          }
        },
        data: {
          status: 'SUSPENDED'
        }
      });
      
      if (result.count > 0) {
        console.log(`Auto-suspended ${result.count} stale test attempts.`);
      }
    } catch (err: any) {
      console.error('Error running background test cleanup job:', err.message);
    }
  }, 3600000); // 1 hour
};
