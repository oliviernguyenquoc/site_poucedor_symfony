<?php

namespace Pouce\UserBundle\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * UserRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class SchoolRepository extends EntityRepository
{
	// To get all schools that participate to the competition on the year
	public function getAllSchoolParticipate($year)
	{
		$qb = $this	-> createQueryBuilder('s')
                    -> join('s.editions','e')
                    -> addSelect('e')
                    -> where('e.year = :year')
                     ->setParameter('year', $year);

		return $qb ;					
	}
}