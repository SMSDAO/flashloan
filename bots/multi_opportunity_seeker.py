import logging

logging.basicConfig(filename='../logs/multi.log', level=logging.INFO)


def run():
    logging.info('Multi-opportunity seeker running!')


if __name__ == '__main__':
    run()
