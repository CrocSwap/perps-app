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
export const getLeverageSegment = (leverage: number) => {
    const leverageSegment =
        leverage < 1
            ? '< 1x'
            : leverage < 2
              ? '< 2x'
              : leverage < 3
                ? '< 3x'
                : leverage < 4
                  ? '< 4x'
                  : leverage < 5
                    ? '< 5x'
                    : leverage < 6
                      ? '< 6x'
                      : leverage < 7
                        ? '< 7x'
                        : leverage < 8
                          ? '< 8x'
                          : leverage < 9
                            ? '< 9x'
                            : leverage < 10
                              ? '< 10x'
                              : leverage < 12
                                ? '< 12x'
                                : leverage < 15
                                  ? '< 15x'
                                  : leverage < 20
                                    ? '< 20x'
                                    : leverage < 25
                                      ? '< 25x'
                                      : leverage < 30
                                        ? '< 30x'
                                        : leverage < 40
                                          ? '< 40x'
                                          : leverage < 50
                                            ? '< 50x'
                                            : leverage < 60
                                              ? '< 60x'
                                              : leverage < 70
                                                ? '< 70x'
                                                : leverage < 80
                                                  ? '< 80x'
                                                  : leverage < 90
                                                    ? '< 90x'
                                                    : leverage < 100
                                                      ? '< 100x'
                                                      : leverage > 100
                                                        ? '> 100x'
                                                        : leverage === 100
                                                          ? '100x'
                                                          : 'unknown';
    return leverageSegment;
};

export const getSizePercentageSegment = (sizePercentage: number) => {
    const sizePercentageSegment =
        sizePercentage < 1
            ? '< 1%'
            : sizePercentage < 2
              ? '< 2%'
              : sizePercentage < 3
                ? '< 3%'
                : sizePercentage < 4
                  ? '< 4%'
                  : sizePercentage < 5
                    ? '< 5%'
                    : sizePercentage < 6
                      ? '< 6%'
                      : sizePercentage < 7
                        ? '< 7%'
                        : sizePercentage < 8
                          ? '< 8%'
                          : sizePercentage < 9
                            ? '< 9%'
                            : sizePercentage < 10
                              ? '< 10%'
                              : sizePercentage < 12
                                ? '< 12%'
                                : sizePercentage < 15
                                  ? '< 15%'
                                  : sizePercentage < 20
                                    ? '< 20%'
                                    : sizePercentage < 25
                                      ? '< 25%'
                                      : sizePercentage < 30
                                        ? '< 30%'
                                        : sizePercentage < 40
                                          ? '< 40%'
                                          : sizePercentage < 50
                                            ? '< 50%'
                                            : sizePercentage < 60
                                              ? '< 60%'
                                              : sizePercentage < 70
                                                ? '< 70%'
                                                : sizePercentage < 80
                                                  ? '< 80%'
                                                  : sizePercentage < 90
                                                    ? '< 90%'
                                                    : sizePercentage < 100
                                                      ? '< 100%'
                                                      : sizePercentage > 100
                                                        ? '> 100%'
                                                        : sizePercentage === 100
                                                          ? '100%'
                                                          : 'unknown';
    return sizePercentageSegment;
};

export const getResolutionSegment = (resolution: number) => {
    const resolutionSegment =
        resolution < 100
            ? '< 100px'
            : resolution < 200
              ? '< 200px'
              : resolution < 300
                ? '< 300px'
                : resolution < 400
                  ? '< 400px'
                  : resolution < 500
                    ? '< 500px'
                    : resolution < 600
                      ? '< 600px'
                      : resolution < 700
                        ? '< 700px'
                        : resolution < 800
                          ? '< 800px'
                          : resolution < 900
                            ? '< 900px'
                            : resolution < 1000
                              ? '< 1000px'
                              : resolution < 1100
                                ? '< 1100px'
                                : resolution < 1200
                                  ? '< 1200px'
                                  : resolution < 1300
                                    ? '< 1300px'
                                    : resolution < 1400
                                      ? '< 1400px'
                                      : resolution < 1500
                                        ? '< 1500px'
                                        : resolution < 1600
                                          ? '< 1600px'
                                          : resolution < 1700
                                            ? '< 1700px'
                                            : resolution < 1800
                                              ? '< 1800px'
                                              : resolution < 1900
                                                ? '< 1900px'
                                                : resolution < 2000
                                                  ? '< 2000px'
                                                  : resolution < 2500
                                                    ? '< 2500px'
                                                    : resolution < 3000
                                                      ? '< 3000px'
                                                      : resolution < 4000
                                                        ? '< 4000px'
                                                        : resolution < 5000
                                                          ? '< 5000px'
                                                          : resolution < 6000
                                                            ? '< 6000px'
                                                            : resolution < 7000
                                                              ? '< 7000px'
                                                              : resolution <
                                                                  8000
                                                                ? '< 8000px'
                                                                : resolution <
                                                                    9000
                                                                  ? '< 9000px'
                                                                  : resolution <
                                                                      10000
                                                                    ? '< 10000px'
                                                                    : resolution >=
                                                                        10000
                                                                      ? '>= 10000px'
                                                                      : 'unknown';
    return resolutionSegment;
};
