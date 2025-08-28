export const getDurationSegment = (
    timeOfSubmission?: number | undefined,
    timeOfCompletion: number | undefined = Date.now(),
) => {
    if (!timeOfSubmission) {
        return 'unknown';
    }
    const duration = timeOfCompletion - timeOfSubmission;
    const durationSeconds = duration / 1000;
    const durationSegment =
        durationSeconds < 0.1
            ? '< 0.1s'
            : durationSeconds < 0.2
              ? '< 0.2s'
              : durationSeconds < 0.5
                ? '< 0.5s'
                : durationSeconds < 0.75
                  ? '< 0.75s'
                  : durationSeconds < 1
                    ? '< 1s'
                    : durationSeconds < 1.5
                      ? '< 1.5s'
                      : durationSeconds < 2
                        ? '< 2s'
                        : durationSeconds < 3
                          ? '< 3s'
                          : durationSeconds < 4
                            ? '< 4s'
                            : durationSeconds < 5
                              ? '< 5s'
                              : durationSeconds < 6
                                ? '< 6s'
                                : durationSeconds < 7
                                  ? '< 7s'
                                  : durationSeconds < 8
                                    ? '< 8s'
                                    : durationSeconds < 9
                                      ? '< 9s'
                                      : durationSeconds < 10
                                        ? '< 10s'
                                        : durationSeconds < 12
                                          ? '< 12s'
                                          : durationSeconds < 15
                                            ? '< 15s'
                                            : durationSeconds < 20
                                              ? '< 20s'
                                              : durationSeconds < 25
                                                ? '< 25s'
                                                : durationSeconds < 30
                                                  ? '< 30s'
                                                  : durationSeconds < 40
                                                    ? '< 40s'
                                                    : durationSeconds < 50
                                                      ? '< 50s'
                                                      : durationSeconds < 60
                                                        ? '< 1m'
                                                        : durationSeconds < 90
                                                          ? '< 1.5m'
                                                          : durationSeconds <
                                                              120
                                                            ? '< 2m'
                                                            : durationSeconds <
                                                                300
                                                              ? '< 5m'
                                                              : durationSeconds <
                                                                  600
                                                                ? '< 10m'
                                                                : durationSeconds <
                                                                    900
                                                                  ? '< 15m'
                                                                  : durationSeconds <
                                                                      1800
                                                                    ? '< 30m'
                                                                    : durationSeconds <
                                                                        3600
                                                                      ? '< 1h'
                                                                      : durationSeconds <
                                                                          7200
                                                                        ? '< 2h'
                                                                        : durationSeconds <
                                                                            86400
                                                                          ? '< 1d'
                                                                          : 'unknown';
    return durationSegment;
};
